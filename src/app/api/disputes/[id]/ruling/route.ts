import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { RBACGuard } from "@/core/engine-04-web/rbac";
import { EscrowLedgerService } from "@/core/engine-03-dbms/ledger";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";
import { DisputeStatus, MilestoneStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    RBACGuard.assertPermission(session.role, "RULE_DISPUTE");
    const { id: disputeId } = await params;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        milestone: true,
        contract: true,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found." }, { status: 404 });
    }

    if (dispute.status === DisputeStatus.RESOLVED) {
      return NextResponse.json({ error: "Dispute is already resolved." }, { status: 400 });
    }

    const { rulingRatioClient, rulingSummary } = await req.json();

    if (typeof rulingRatioClient !== "number" || rulingRatioClient < 0 || rulingRatioClient > 1) {
      return NextResponse.json({ error: "Client ruling ratio must be between 0.0 and 1.0." }, { status: 400 });
    }

    const clientRatio = Math.round(rulingRatioClient * 100) / 100;
    const freelancerRatio = Math.round((1.0 - clientRatio) * 100) / 100;

    // Execute ACID Split Settlement on Ledger
    const splitResult = await EscrowLedgerService.settleDisputeSplit({
      disputeId: dispute.id,
      milestoneId: dispute.milestoneId,
      clientId: dispute.contract.clientId,
      freelancerId: dispute.contract.freelancerId,
      totalAmount: dispute.milestone.amount,
      clientRatio,
      freelancerRatio,
    });

    // Update Dispute and Milestone status
    const updated = await prisma.$transaction(async (tx) => {
      const d = await tx.dispute.update({
        where: { id: dispute.id },
        data: {
          status: DisputeStatus.RESOLVED,
          rulingRatioClient: clientRatio,
          rulingRatioFreelancer: freelancerRatio,
          rulingSummary: rulingSummary || `Binding Ruling: ${clientRatio * 100}% refund to Client, ${freelancerRatio * 100}% payout to Freelancer.`,
          resolvedAt: new Date(),
        },
      });

      await tx.milestone.update({
        where: { id: dispute.milestoneId },
        data: {
          status: clientRatio === 1.0 ? MilestoneStatus.REFUNDED : MilestoneStatus.APPROVED,
        },
      });

      return d;
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "DISPUTE_RULED",
      resourceType: "Dispute",
      resourceId: dispute.id,
      payload: { clientRatio, freelancerRatio, splitResult },
    });

    return NextResponse.json({ success: true, dispute: updated, splitResult });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Dispute ruling error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute ruling." }, { status: 400 });
  }
}
