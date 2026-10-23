import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { RBACGuard } from "@/core/engine-04-web/rbac";
import { ProposalMatcher } from "@/core/engine-02-dsa-se/matcher";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: jobId } = await params;
    const proposals = await prisma.proposal.findMany({
      where: { jobId },
      include: {
        freelancer: {
          select: { id: true, name: true, email: true, profile: true },
        },
      },
      orderBy: { heuristicScore: "desc" },
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Fetch proposals error:", error);
    return NextResponse.json({ error: "Failed to fetch proposals." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    RBACGuard.assertPermission(session.role, "SUBMIT_PROPOSAL");
    const { id: jobId } = await params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const { bidAmount, deliveryDays, coverLetter } = await req.json();

    if (!bidAmount || !deliveryDays || !coverLetter) {
      return NextResponse.json({ error: "Bid amount, delivery days, and cover letter are required." }, { status: 400 });
    }

    // Fetch freelancer profile for skills and reputation score
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    });

    // Run Engine 02: Heuristic Proposal Matcher
    const matchAnalysis = ProposalMatcher.computeMatchScore(
      {
        freelancerSkills: profile?.skills || [],
        bidAmount: parseFloat(bidAmount),
        reputationScore: profile?.reputationScore || 5.0,
      },
      {
        requiredSkills: job.requiredSkills,
        targetBudget: job.budget,
      }
    );

    const proposal = await prisma.proposal.upsert({
      where: {
        jobId_freelancerId: {
          jobId,
          freelancerId: session.userId,
        },
      },
      update: {
        bidAmount: parseFloat(bidAmount),
        deliveryDays: parseInt(deliveryDays),
        coverLetter,
        heuristicScore: matchAnalysis.overallScore,
      },
      create: {
        jobId,
        freelancerId: session.userId,
        bidAmount: parseFloat(bidAmount),
        deliveryDays: parseInt(deliveryDays),
        coverLetter,
        heuristicScore: matchAnalysis.overallScore,
      },
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "PROPOSAL_SUBMITTED",
      resourceType: "Proposal",
      resourceId: proposal.id,
      payload: { bidAmount, heuristicScore: matchAnalysis.overallScore },
    });

    return NextResponse.json({ success: true, proposal, matchAnalysis });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Submit proposal error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit proposal." }, { status: 400 });
  }
}
