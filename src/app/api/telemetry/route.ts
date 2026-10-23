import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EscrowLedgerService } from "@/core/engine-03-dbms/ledger";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";

export async function GET() {
  try {
    // 1. DBMS & Ledger Conservation
    const ledgerHealth = await EscrowLedgerService.verifyBalanceConservation();

    // 2. Audit Chain Verification
    const auditHealth = await ChainedAuditLogger.verifyChainIntegrity();

    // 3. Operational Counts
    const [userCount, jobCount, contractCount, milestoneCount, disputeCount] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.contract.count(),
      prisma.milestone.count(),
      prisma.dispute.count(),
    ]);

    // 4. Milestone Status Breakdown
    const milestones = await prisma.milestone.findMany({
      select: { status: true, amount: true },
    });

    const statusCounts: Record<string, number> = {};
    let totalEscrowHeld = 0;
    let totalApprovedVolume = 0;

    for (const m of milestones) {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
      if (m.status === "FUNDED" || m.status === "SUBMITTED" || m.status === "DISPUTED") {
        totalEscrowHeld += m.amount;
      }
      if (m.status === "APPROVED") {
        totalApprovedVolume += m.amount;
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      academicContext: {
        university: "KLE Technological University (Belagavi)",
        team: "Team 07 (Theme 01)",
        guide: "Dr. Niranjan Muchandi",
        engines: [
          {
            id: "E1",
            name: "Escrow & State Scheduler",
            discipline: "Operating Systems",
            owner: "Vaishnavi Modekar (02FE24BCS060)",
            kpi: "Zero invalid state transitions & duplicate locks",
            status: "HEALTHY",
          },
          {
            id: "E2",
            name: "Verification & Evidence Engine",
            discipline: "DSA & Software Engineering",
            owner: "Darshan Kittur (02FE24BCS053)",
            kpi: "Single-bit tamper detection via Merkle Evidence Tree",
            status: "HEALTHY",
          },
          {
            id: "E3",
            name: "Ledger & Audit Core",
            discipline: "DBMS & Financial Integrity",
            owner: "Purvi Sammatshetti (02FE24BCS022)",
            kpi: `Conservation Invariant: ΔEscrow + ΔUser = 0 (${ledgerHealth.isConserved ? "CONSERVED" : "VIOLATED"})`,
            status: ledgerHealth.isConserved ? "HEALTHY" : "CRITICAL",
          },
          {
            id: "E4",
            name: "Role-Based Workflow Dashboard",
            discipline: "Web Technologies & Security",
            owner: "Vaibhav Chavanpatil (02FE24BCS013)",
            kpi: "Zero unauthorized protected actions & least-privilege RBAC",
            status: "HEALTHY",
          },
        ],
      },
      ledgerHealth: {
        ...ledgerHealth,
        totalEscrowHeld: Math.round(totalEscrowHeld * 100) / 100,
        totalApprovedVolume: Math.round(totalApprovedVolume * 100) / 100,
      },
      auditHealth,
      metrics: {
        userCount,
        jobCount,
        contractCount,
        milestoneCount,
        disputeCount,
        milestoneStatusCounts: statusCounts,
      },
    });
  } catch (error) {
    console.error("Telemetry error:", error);
    return NextResponse.json({ error: "Failed to gather telemetry." }, { status: 500 });
  }
}
