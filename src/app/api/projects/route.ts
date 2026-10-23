import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { RBACGuard } from "@/core/engine-04-web/rbac";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        client: {
          select: { id: true, name: true, email: true, profile: true },
        },
        proposals: {
          select: { id: true, bidAmount: true, heuristicScore: true, freelancerId: true },
        },
        contract: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    RBACGuard.assertPermission(session.role, "POST_JOB");

    const { title, description, category, budget, requiredSkills } = await req.json();

    if (!title || !description || !budget) {
      return NextResponse.json({ error: "Title, description, and budget are required." }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        clientId: session.userId,
        title,
        description,
        category: category || "Engineering",
        budget: parseFloat(budget),
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      },
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "JOB_POSTED",
      resourceType: "Job",
      resourceId: job.id,
      payload: { title, budget },
    });

    return NextResponse.json({ success: true, job });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create job error:", err);
    return NextResponse.json({ error: err.message || "Failed to create job." }, { status: 400 });
  }
}
