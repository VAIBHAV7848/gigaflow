import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";
import { DisputeStatus, MilestoneStatus } from "@prisma/client";

export async function GET() {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        contract: {
          select: { id: true, title: true, client: true, freelancer: true },
        },
        milestone: true,
        initiator: {
          select: { id: true, name: true, role: true },
        },
        arbiter: {
          select: { id: true, name: true },
        },
        evidenceNodes: {
          orderBy: { merkleIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error("Fetch disputes error:", error);
    return NextResponse.json({ error: "Failed to fetch disputes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { contractId, milestoneId, reason, clientClaimRatio } = await req.json();

    if (!contractId || !milestoneId || !reason) {
      return NextResponse.json({ error: "Contract ID, milestone ID, and reason are required." }, { status: 400 });
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
    }

    const cRatio = typeof clientClaimRatio === "number" ? clientClaimRatio : 0.5;
    const fRatio = 1.0 - cRatio;

    // Pick an arbiter (Carol Vance by default if available)
    const arbiter = await prisma.user.findFirst({
      where: { role: "ARBITER" },
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update milestone to DISPUTED
      await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: MilestoneStatus.DISPUTED },
      });

      // 2. Create dispute
      const dispute = await tx.dispute.create({
        data: {
          contractId,
          milestoneId,
          initiatorId: session.userId,
          arbiterId: arbiter?.id,
          reason,
          status: DisputeStatus.OPEN,
          clientClaimRatio: cRatio,
          freelancerClaimRatio: fRatio,
        },
      });

      return dispute;
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "DISPUTE_OPENED",
      resourceType: "Dispute",
      resourceId: result.id,
      payload: { milestoneId, reason, clientClaimRatio: cRatio },
    });

    return NextResponse.json({ success: true, dispute: result });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Open dispute error:", err);
    return NextResponse.json({ error: err.message || "Failed to open dispute." }, { status: 400 });
  }
}
