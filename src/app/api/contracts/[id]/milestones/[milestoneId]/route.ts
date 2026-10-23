import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { EscrowStateMachine, MilestoneState } from "@/core/engine-01-os/escrow-fsm";
import { WatchdogScheduler } from "@/core/engine-01-os/watchdog";
import { keyedLock } from "@/core/engine-01-os/mutex";
import { CryptographicHasher } from "@/core/engine-02-dsa-se/hasher";
import { EscrowLedgerService } from "@/core/engine-03-dbms/ledger";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";
import { MilestoneStatus, ContractStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: contractId, milestoneId } = await params;
    const body = await req.json();
    const { action } = body;

    // Concurrency Mutex lock on milestone to prevent race conditions
    return await keyedLock.getMutex(milestoneId).runExclusive(async () => {
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          milestones: { orderBy: { sequenceIndex: "asc" } },
        },
      });

      if (!contract) {
        return NextResponse.json({ error: "Contract not found." }, { status: 404 });
      }

      const milestone = contract.milestones.find((m) => m.id === milestoneId);
      if (!milestone) {
        return NextResponse.json({ error: "Milestone not found." }, { status: 404 });
      }

      // -----------------------------------------------------------------------
      // Action: FUND ESCROW (Client locks funds in Escrow Hold)
      // -----------------------------------------------------------------------
      if (action === "fund") {
        if (contract.clientId !== session.userId && session.role !== "ADMIN") {
          return NextResponse.json({ error: "Only the client can fund this milestone." }, { status: 403 });
        }

        // Sequential validation (Milestone K requires K-1 to be approved/refunded)
        const seqCheck = EscrowStateMachine.validateSequentialExecution(
          milestone.sequenceIndex,
          contract.milestones.map((m) => ({ sequenceIndex: m.sequenceIndex, status: m.status as MilestoneState }))
        );
        if (!seqCheck.eligible) {
          return NextResponse.json({ error: seqCheck.reason }, { status: 400 });
        }

        // FSM validation
        const fsmResult = EscrowStateMachine.transition(milestone.status as MilestoneState, "FUNDED");
        if (!fsmResult.success) {
          return NextResponse.json({ error: fsmResult.error }, { status: 400 });
        }

        // ACID Double-Entry Ledger Lock
        await EscrowLedgerService.lockMilestoneEscrow({
          clientId: contract.clientId,
          milestoneId: milestone.id,
          amount: milestone.amount,
        });

        // Update milestone status
        const updated = await prisma.milestone.update({
          where: { id: milestone.id },
          data: { status: MilestoneStatus.FUNDED },
        });

        await ChainedAuditLogger.recordEvent({
          actorId: session.userId,
          actorRole: session.role,
          action: "ESCROW_LOCKED",
          resourceType: "Milestone",
          resourceId: milestone.id,
          payload: { amount: milestone.amount, sequenceIndex: milestone.sequenceIndex },
        });

        return NextResponse.json({ success: true, milestone: updated });
      }

      // -----------------------------------------------------------------------
      // Action: SUBMIT DELIVERABLE (Freelancer uploads code/proof + SHA256)
      // -----------------------------------------------------------------------
      if (action === "submit") {
        if (contract.freelancerId !== session.userId && session.role !== "ADMIN") {
          return NextResponse.json({ error: "Only the assigned freelancer can submit deliverables." }, { status: 403 });
        }

        const { deliverableUrl, deliverableNotes, commitSha } = body;
        if (!deliverableUrl) {
          return NextResponse.json({ error: "Deliverable URL is required." }, { status: 400 });
        }

        // FSM check
        const fsmResult = EscrowStateMachine.transition(milestone.status as MilestoneState, "SUBMITTED");
        if (!fsmResult.success) {
          return NextResponse.json({ error: fsmResult.error }, { status: 400 });
        }

        // Compute Cryptographic SHA-256 Deliverable Checksum
        const timestamp = new Date().toISOString();
        const contentPayload = `${deliverableUrl}:${deliverableNotes || ""}:${commitSha || "main"}`;
        const deliverableHash = CryptographicHasher.deliverableDigest(
          commitSha || "commit_head",
          CryptographicHasher.sha256(contentPayload),
          timestamp
        );

        // 7-Calendar-Day Review Watchdog Timer
        const reviewDeadline = WatchdogScheduler.calculateDeadline(new Date(), 7);

        const updated = await prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: MilestoneStatus.SUBMITTED,
            deliverableUrl,
            deliverableHash,
            submittedAt: new Date(),
            reviewDeadline,
          },
        });

        await ChainedAuditLogger.recordEvent({
          actorId: session.userId,
          actorRole: session.role,
          action: "DELIVERABLE_SUBMITTED",
          resourceType: "Milestone",
          resourceId: milestone.id,
          payload: { deliverableUrl, deliverableHash, reviewDeadline },
        });

        return NextResponse.json({ success: true, milestone: updated });
      }

      // -----------------------------------------------------------------------
      // Action: APPROVE & RELEASE (Client approves or Watchdog auto-triggers)
      // -----------------------------------------------------------------------
      if (action === "approve") {
        if (contract.clientId !== session.userId && session.role !== "ADMIN") {
          return NextResponse.json({ error: "Only the client can approve this milestone." }, { status: 403 });
        }

        // FSM check
        const fsmResult = EscrowStateMachine.transition(milestone.status as MilestoneState, "APPROVED");
        if (!fsmResult.success) {
          return NextResponse.json({ error: fsmResult.error }, { status: 400 });
        }

        // ACID Double-Entry Release (90% to Freelancer, 10% to Platform Fee)
        const payoutResult = await EscrowLedgerService.releaseMilestoneEscrow({
          milestoneId: milestone.id,
          freelancerId: contract.freelancerId,
          totalAmount: milestone.amount,
          platformFeePercent: 0.1,
        });

        const updated = await prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: MilestoneStatus.APPROVED,
            approvedAt: new Date(),
          },
        });

        // Check if all milestones are approved => Complete Contract
        const allApproved = contract.milestones.every(
          (m) => m.id === milestone.id || m.status === MilestoneStatus.APPROVED
        );

        if (allApproved) {
          await prisma.contract.update({
            where: { id: contract.id },
            data: { status: ContractStatus.COMPLETED },
          });
        }

        await ChainedAuditLogger.recordEvent({
          actorId: session.userId,
          actorRole: session.role,
          action: "MILESTONE_APPROVED",
          resourceType: "Milestone",
          resourceId: milestone.id,
          payload: { payoutResult, allApproved },
        });

        return NextResponse.json({ success: true, milestone: updated, payoutResult });
      }

      // -----------------------------------------------------------------------
      // Action: WATCHDOG TIMEOUT TRIGGER
      // -----------------------------------------------------------------------
      if (action === "check_watchdog") {
        if (milestone.status !== MilestoneStatus.SUBMITTED || !milestone.submittedAt) {
          return NextResponse.json({ error: "Milestone is not in SUBMITTED state." }, { status: 400 });
        }

        const evaluation = WatchdogScheduler.evaluateTimeout(milestone.submittedAt, milestone.reviewDeadline);
        
        if (evaluation.hasExpired) {
          // Auto-release escrow!
          const payoutResult = await EscrowLedgerService.releaseMilestoneEscrow({
            milestoneId: milestone.id,
            freelancerId: contract.freelancerId,
            totalAmount: milestone.amount,
            platformFeePercent: 0.1,
          });

          const updated = await prisma.milestone.update({
            where: { id: milestone.id },
            data: {
              status: MilestoneStatus.APPROVED,
              approvedAt: new Date(),
            },
          });

          await ChainedAuditLogger.recordEvent({
            actorId: "WATCHDOG_DAEMON",
            actorRole: "SYSTEM",
            action: "WATCHDOG_AUTO_RELEASE",
            resourceType: "Milestone",
            resourceId: milestone.id,
            payload: { evaluation, payoutResult },
          });

          return NextResponse.json({ success: true, triggered: true, milestone: updated, payoutResult });
        }

        return NextResponse.json({ success: true, triggered: false, evaluation });
      }

      return NextResponse.json({ error: `Unknown action '${action}'.` }, { status: 400 });
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Milestone action error:", err);
    return NextResponse.json({ error: err.message || "Action failed." }, { status: 400 });
  }
}
