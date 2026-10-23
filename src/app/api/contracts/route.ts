import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SessionService } from "@/core/engine-04-web/session";

export async function GET() {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const whereClause =
      session.role === "ADMIN" || session.role === "ARBITER"
        ? {}
        : session.role === "CLIENT"
        ? { clientId: session.userId }
        : { freelancerId: session.userId };

    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        freelancer: {
          select: { id: true, name: true, email: true },
        },
        milestones: {
          orderBy: { sequenceIndex: "asc" },
        },
        disputes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Fetch contracts error:", error);
    return NextResponse.json({ error: "Failed to fetch contracts." }, { status: 500 });
  }
}
