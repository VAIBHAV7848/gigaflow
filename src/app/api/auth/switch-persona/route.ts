import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { SessionService, SESSION_COOKIE_NAME } from "@/core/engine-04-web/session";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role || !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const demoInfo = SessionService.DEMO_PERSONAS[role as Role];
    if (!demoInfo) {
      return NextResponse.json({ error: "Demo persona not found." }, { status: 404 });
    }

    // Find the persona user in the database
    let user = await prisma.user.findUnique({
      where: { email: demoInfo.email },
      include: { profile: true },
    });

    if (!user) {
      // Create if missing
      user = await prisma.user.create({
        data: {
          email: demoInfo.email,
          name: demoInfo.name,
          role: demoInfo.role,
          passwordHash: "demo_seeded_hash",
          profile: {
            create: {
              headline: demoInfo.bio,
              walletBalance: role === Role.CLIENT ? 25000 : 5000,
            },
          },
        },
        include: { profile: true },
      });
    }

    const token = SessionService.signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Persona switch error:", error);
    return NextResponse.json({ error: "Failed to switch persona." }, { status: 500 });
  }
}
