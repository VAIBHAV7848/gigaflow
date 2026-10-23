import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { SessionService, SESSION_COOKIE_NAME } from "@/core/engine-04-web/session";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const assignedRole = role && Object.values(Role).includes(role) ? (role as Role) : Role.CLIENT;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: assignedRole,
        profile: {
          create: {
            walletBalance: assignedRole === Role.CLIENT ? 10000 : 2000,
            headline: `${assignedRole} on GigaFlow`,
          },
        },
      },
    });

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
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
