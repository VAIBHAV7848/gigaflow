import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/core/engine-04-web/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
