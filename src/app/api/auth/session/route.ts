import { NextResponse } from "next/server";
import { SessionService } from "@/core/engine-04-web/session";

export async function GET() {
  const session = await SessionService.getSession();
  return NextResponse.json({
    authenticated: !!session,
    user: session,
  });
}
