import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ChainedAuditLogger } from "@/core/engine-03-dbms/audit-logger";

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const integrity = await ChainedAuditLogger.verifyChainIntegrity();

    return NextResponse.json({
      logs,
      integrity,
    });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs." }, { status: 500 });
  }
}
