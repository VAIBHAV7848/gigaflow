import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { RBACGuard } from "@/core/engine-04-web/rbac";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";
import { ContractStatus, JobStatus, MilestoneStatus, ProposalStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    RBACGuard.assertPermission(session.role, "AWARD_CONTRACT");
    const { id: proposalId } = await params;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { job: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    if (proposal.job.clientId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only the project owner can award this contract." }, { status: 403 });
    }

    const { milestones } = await req.json();

    // Default 3 equal sequential milestones if not specified
    const milestonePlan = Array.isArray(milestones) && milestones.length > 0 ? milestones : [
      { sequenceIndex: 1, title: "Milestone 1: Scaffold & Architecture", amount: proposal.bidAmount * 0.33 },
      { sequenceIndex: 2, title: "Milestone 2: Core Engine Implementation", amount: proposal.bidAmount * 0.33 },
      { sequenceIndex: 3, title: "Milestone 3: UI, Polish & Final Delivery", amount: proposal.bidAmount * 0.34 },
    ];

    const result = await prisma.$transaction(async (tx) => {
      // 1. Accept proposal and reject competitors
      await tx.proposal.update({
        where: { id: proposalId },
        data: { status: ProposalStatus.ACCEPTED },
      });

      await tx.proposal.updateMany({
        where: {
          jobId: proposal.jobId,
          id: { not: proposalId },
        },
        data: { status: ProposalStatus.REJECTED },
      });

      // 2. Update job status
      await tx.job.update({
        where: { id: proposal.jobId },
        data: { status: JobStatus.IN_PROGRESS },
      });

      // 3. Create Contract
      const contract = await tx.contract.create({
        data: {
          jobId: proposal.jobId,
          clientId: proposal.job.clientId,
          freelancerId: proposal.freelancerId,
          title: `${proposal.job.title} — Contract`,
          totalAmount: proposal.bidAmount,
          status: ContractStatus.ACTIVE,
        },
      });

      // 4. Create sequential milestones
      for (const m of milestonePlan) {
        await tx.milestone.create({
          data: {
            contractId: contract.id,
            sequenceIndex: m.sequenceIndex,
            title: m.title,
            description: m.description || `Deliverables for Milestone #${m.sequenceIndex}`,
            amount: Math.round(m.amount * 100) / 100,
            status: MilestoneStatus.LOCKED,
          },
        });
      }

      return contract;
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "CONTRACT_AWARDED",
      resourceType: "Contract",
      resourceId: result.id,
      payload: { proposalId, totalAmount: proposal.bidAmount },
    });

    return NextResponse.json({ success: true, contract: result });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Award contract error:", err);
    return NextResponse.json({ error: err.message || "Failed to award contract." }, { status: 400 });
  }
}
