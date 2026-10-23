import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";
import { EscrowLedgerService } from "@/core/engine-03-dbms/ledger";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";
import { AccountType, EntryType, TransactionType } from "@prisma/client";

export async function GET() {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Fetch user profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    });

    // Fetch user's available ledger account
    const userAccount = await prisma.ledgerAccount.findFirst({
      where: {
        userId: session.userId,
        accountType: AccountType.USER_AVAILABLE,
      },
    });

    // Fetch transactions involving the user
    let transactions: unknown[] = [];
    if (userAccount) {
      const entries = await prisma.ledgerEntry.findMany({
        where: { accountId: userAccount.id },
        include: {
          transaction: {
            include: {
              entries: {
                include: { account: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      transactions = entries.map((e) => ({
        entryId: e.id,
        entryType: e.entryType,
        amount: e.amount,
        createdAt: e.createdAt,
        txType: e.transaction.txType,
        description: e.transaction.description,
        referenceId: e.transaction.referenceId,
      }));
    }

    // Calculate Escrow in-hold for this user
    let escrowHeld = 0;
    if (session.role === "CLIENT") {
      const activeContracts = await prisma.contract.findMany({
        where: { clientId: session.userId, status: "ACTIVE" },
        include: {
          milestones: {
            where: { status: { in: ["FUNDED", "SUBMITTED", "DISPUTED"] } },
          },
        },
      });
      for (const c of activeContracts) {
        for (const m of c.milestones) {
          escrowHeld += m.amount;
        }
      }
    } else if (session.role === "FREELANCER") {
      const activeContracts = await prisma.contract.findMany({
        where: { freelancerId: session.userId, status: "ACTIVE" },
        include: {
          milestones: {
            where: { status: { in: ["FUNDED", "SUBMITTED", "DISPUTED"] } },
          },
        },
      });
      for (const c of activeContracts) {
        for (const m of c.milestones) {
          escrowHeld += m.amount;
        }
      }
    }

    const ledgerHealth = await EscrowLedgerService.verifyBalanceConservation();

    return NextResponse.json({
      walletBalance: profile?.walletBalance || 0,
      escrowHeld: Math.round(escrowHeld * 100) / 100,
      reputationScore: profile?.reputationScore || 5.0,
      completedJobsCount: profile?.completedJobsCount || 0,
      transactions,
      ledgerHealth,
    });
  } catch (error) {
    console.error("Wallet fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch wallet." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { amount } = await req.json();
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: "Invalid deposit amount." }, { status: 400 });
    }

    const idempotencyKey = `DEPOSIT_${session.userId}_${Date.now()}`;

    // Execute Double-Entry Deposit Transaction:
    // Debit: SYSTEM_RESERVE (Asset increases)
    // Credit: USER_AVAILABLE (Platform liability to user increases)
    const result = await prisma.$transaction(async (tx) => {
      const reserveAccount = await EscrowLedgerService.getOrCreateAccount(tx, {
        accountType: AccountType.SYSTEM_RESERVE,
      });

      const userAccount = await EscrowLedgerService.getOrCreateAccount(tx, {
        accountType: AccountType.USER_AVAILABLE,
        userId: session.userId,
      });

      const transaction = await tx.ledgerTransaction.create({
        data: {
          txType: TransactionType.DEPOSIT,
          referenceId: session.userId,
          idempotencyKey,
          description: `Simulated Top-up of $${depositAmount} via Demo Payment Gateway`,
        },
      });

      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: transaction.id,
            accountId: reserveAccount.id,
            entryType: EntryType.DEBIT,
            amount: depositAmount,
          },
          {
            transactionId: transaction.id,
            accountId: userAccount.id,
            entryType: EntryType.CREDIT,
            amount: depositAmount,
          },
        ],
      });

      const updatedProfile = await tx.profile.update({
        where: { userId: session.userId },
        data: { walletBalance: { increment: depositAmount } },
      });

      return { transactionId: transaction.id, newBalance: updatedProfile.walletBalance };
    });

    await ChainedAuditLogger.recordEvent({
      actorId: session.userId,
      actorRole: session.role,
      action: "FUNDS_DEPOSITED",
      resourceType: "Wallet",
      resourceId: session.userId,
      payload: { amount: depositAmount, newBalance: result.newBalance },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Deposit error:", err);
    return NextResponse.json({ error: err.message || "Deposit failed." }, { status: 400 });
  }
}
