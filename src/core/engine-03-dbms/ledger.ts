/**
 * ENGINE 03: Ledger & Audit Core (DBMS & Financial Integrity)
 * Primary Student Owner: Purvi Sammatshetti (02FE24BCS022)
 * Module: Double-Entry ACID Escrow Ledger
 * 
 * Requirements Supported: FR-01, FR-05, NFR-08
 * Core Mathematical Invariant:
 *   Σ Debits = Σ Credits  <=>  ΔEscrow + ΔUser = 0
 * Every balance change is an immutable transaction with paired entries.
 * No mutable balance overwrites.
 */

import { prisma } from "@/lib/prisma";
import { AccountType, EntryType, TransactionType } from "@prisma/client";

export class EscrowLedgerService {
  /**
   * Helper: Finds or creates an internal ledger account
   */
  static async getOrCreateAccount(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    params: {
      accountType: AccountType;
      userId?: string;
      contractId?: string;
      milestoneId?: string;
      currency?: string;
    }
  ) {
    const existing = await tx.ledgerAccount.findFirst({
      where: {
        accountType: params.accountType,
        userId: params.userId ?? null,
        contractId: params.contractId ?? null,
        milestoneId: params.milestoneId ?? null,
      },
    });

    if (existing) return existing;

    return await tx.ledgerAccount.create({
      data: {
        accountType: params.accountType,
        userId: params.userId,
        contractId: params.contractId,
        milestoneId: params.milestoneId,
        currency: params.currency || "USD",
      },
    });
  }

  /**
   * Calculates the real-time balance of any account by summing its immutable entries:
   * For Liabilities/Equity (User Available, Escrow Hold, Revenue): Credits - Debits
   * For Assets (System Reserve): Debits - Credits
   */
  static async getAccountBalance(accountId: string): Promise<number> {
    const entries = await prisma.ledgerEntry.findMany({
      where: { accountId },
    });

    const account = await prisma.ledgerAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) return 0;

    const isAsset = account.accountType === AccountType.SYSTEM_RESERVE;
    let balance = 0;

    for (const e of entries) {
      if (isAsset) {
        balance += e.entryType === EntryType.DEBIT ? e.amount : -e.amount;
      } else {
        balance += e.entryType === EntryType.CREDIT ? e.amount : -e.amount;
      }
    }

    return Math.round(balance * 100) / 100;
  }

  /**
   * Milestone Escrow Lock: Client moves funds from Available to Milestone Escrow Hold
   */
  static async lockMilestoneEscrow(params: {
    clientId: string;
    milestoneId: string;
    amount: number;
    currency?: string;
  }) {
    const idempotencyKey = `LOCK_MILESTONE_${params.milestoneId}_${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Get Accounts
      const clientAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.USER_AVAILABLE,
        userId: params.clientId,
        currency: params.currency,
      });

      const escrowAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.ESCROW_HOLD,
        milestoneId: params.milestoneId,
        currency: params.currency,
      });

      // 2. Prevent duplicate lock on same milestone
      const priorLock = await tx.ledgerTransaction.findFirst({
        where: {
          referenceId: params.milestoneId,
          txType: TransactionType.ESCROW_LOCK,
        },
      });

      if (priorLock) {
        throw new Error(`Duplicate lock rejected: Milestone '${params.milestoneId}' is already funded.`);
      }

      // 3. Create Transaction Record
      const transaction = await tx.ledgerTransaction.create({
        data: {
          txType: TransactionType.ESCROW_LOCK,
          referenceId: params.milestoneId,
          idempotencyKey,
          description: `Locked $${params.amount} into Escrow Hold for Milestone ${params.milestoneId}`,
        },
      });

      // 4. Paired Entries: Debit Client (reduce liability), Credit Escrow (create hold)
      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: transaction.id,
            accountId: clientAccount.id,
            entryType: EntryType.DEBIT,
            amount: params.amount,
          },
          {
            transactionId: transaction.id,
            accountId: escrowAccount.id,
            entryType: EntryType.CREDIT,
            amount: params.amount,
          },
        ],
      });

      // 5. Update user profile wallet cache for fast read displays
      await tx.profile.update({
        where: { userId: params.clientId },
        data: { walletBalance: { decrement: params.amount } },
      });

      return { success: true, transactionId: transaction.id };
    });
  }

  /**
   * Milestone Escrow Release: Atomic payout upon approval or 7-day timeout
   */
  static async releaseMilestoneEscrow(params: {
    milestoneId: string;
    freelancerId: string;
    totalAmount: number;
    platformFeePercent?: number; // e.g. 0.1 for 10%
    currency?: string;
  }) {
    const feeRate = params.platformFeePercent ?? 0.1;
    const platformFee = Math.round(params.totalAmount * feeRate * 100) / 100;
    const freelancerNet = Math.round((params.totalAmount - platformFee) * 100) / 100;
    const idempotencyKey = `RELEASE_MILESTONE_${params.milestoneId}_${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      // 1. Prevent duplicate releases
      const priorRelease = await tx.ledgerTransaction.findFirst({
        where: {
          referenceId: params.milestoneId,
          txType: TransactionType.ESCROW_RELEASE,
        },
      });

      if (priorRelease) {
        throw new Error(`Duplicate release rejected: Escrow for Milestone '${params.milestoneId}' was already disbursed.`);
      }

      // 2. Fetch Accounts
      const escrowAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.ESCROW_HOLD,
        milestoneId: params.milestoneId,
        currency: params.currency,
      });

      const freelancerAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.USER_AVAILABLE,
        userId: params.freelancerId,
        currency: params.currency,
      });

      const revenueAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.PLATFORM_REVENUE,
        currency: params.currency,
      });

      // 3. Create Transaction
      const transaction = await tx.ledgerTransaction.create({
        data: {
          txType: TransactionType.ESCROW_RELEASE,
          referenceId: params.milestoneId,
          idempotencyKey,
          description: `Disbursed $${params.totalAmount}: Net $${freelancerNet} to Freelancer, Fee $${platformFee} to Platform`,
        },
      });

      // 4. Multi-Legged Entries (Balanced Zero-Sum):
      // Debit Escrow Hold ($totalAmount)
      // Credit Freelancer ($freelancerNet)
      // Credit Platform Revenue ($platformFee)
      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: transaction.id,
            accountId: escrowAccount.id,
            entryType: EntryType.DEBIT,
            amount: params.totalAmount,
          },
          {
            transactionId: transaction.id,
            accountId: freelancerAccount.id,
            entryType: EntryType.CREDIT,
            amount: freelancerNet,
          },
          {
            transactionId: transaction.id,
            accountId: revenueAccount.id,
            entryType: EntryType.CREDIT,
            amount: platformFee,
          },
        ],
      });

      // 5. Update Freelancer Wallet cache
      await tx.profile.update({
        where: { userId: params.freelancerId },
        data: {
          walletBalance: { increment: freelancerNet },
          completedJobsCount: { increment: 1 },
        },
      });

      return { success: true, transactionId: transaction.id, freelancerNet, platformFee };
    });
  }

  /**
   * Split Dispute Settlement: Arbiter ruling releasing ratios to Client and Freelancer
   */
  static async settleDisputeSplit(params: {
    disputeId: string;
    milestoneId: string;
    clientId: string;
    freelancerId: string;
    totalAmount: number;
    clientRatio: number; // e.g. 0.6 (60%)
    freelancerRatio: number; // e.g. 0.4 (40%)
    currency?: string;
  }) {
    const clientAmount = Math.round(params.totalAmount * params.clientRatio * 100) / 100;
    const freelancerAmount = Math.round(params.totalAmount * params.freelancerRatio * 100) / 100;
    const idempotencyKey = `DISPUTE_SETTLE_${params.disputeId}_${Date.now()}`;

    return await prisma.$transaction(async (tx) => {
      const escrowAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.ESCROW_HOLD,
        milestoneId: params.milestoneId,
        currency: params.currency,
      });

      const clientAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.USER_AVAILABLE,
        userId: params.clientId,
        currency: params.currency,
      });

      const freelancerAccount = await this.getOrCreateAccount(tx, {
        accountType: AccountType.USER_AVAILABLE,
        userId: params.freelancerId,
        currency: params.currency,
      });

      const transaction = await tx.ledgerTransaction.create({
        data: {
          txType: TransactionType.DISPUTE_SPLIT,
          referenceId: params.disputeId,
          idempotencyKey,
          description: `Dispute Split Settlement: $${clientAmount} refunded to Client, $${freelancerAmount} paid to Freelancer`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: transaction.id,
            accountId: escrowAccount.id,
            entryType: EntryType.DEBIT,
            amount: params.totalAmount,
          },
          {
            transactionId: transaction.id,
            accountId: clientAccount.id,
            entryType: EntryType.CREDIT,
            amount: clientAmount,
          },
          {
            transactionId: transaction.id,
            accountId: freelancerAccount.id,
            entryType: EntryType.CREDIT,
            amount: freelancerAmount,
          },
        ],
      });

      if (clientAmount > 0) {
        await tx.profile.update({
          where: { userId: params.clientId },
          data: { walletBalance: { increment: clientAmount } },
        });
      }

      if (freelancerAmount > 0) {
        await tx.profile.update({
          where: { userId: params.freelancerId },
          data: { walletBalance: { increment: freelancerAmount } },
        });
      }

      return { success: true, transactionId: transaction.id, clientAmount, freelancerAmount };
    });
  }

  /**
   * Mathematical Balance Conservation Check (System Health Audit)
   * Verifies that across all recorded ledger entries: Σ Debits === Σ Credits
   */
  static async verifyBalanceConservation(): Promise<{
    isConserved: boolean;
    totalDebits: number;
    totalCredits: number;
    delta: number;
    totalTransactions: number;
  }> {
    const entries = await prisma.ledgerEntry.findMany();
    const txCount = await prisma.ledgerTransaction.count();

    let totalDebits = 0;
    let totalCredits = 0;

    for (const e of entries) {
      if (e.entryType === EntryType.DEBIT) {
        totalDebits += e.amount;
      } else {
        totalCredits += e.amount;
      }
    }

    totalDebits = Math.round(totalDebits * 100) / 100;
    totalCredits = Math.round(totalCredits * 100) / 100;
    const delta = Math.round(Math.abs(totalDebits - totalCredits) * 100) / 100;

    return {
      isConserved: delta === 0,
      totalDebits,
      totalCredits,
      delta,
      totalTransactions: txCount,
    };
  }
}
