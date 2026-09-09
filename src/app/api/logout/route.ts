import { NextResponse } from "next/server";
import { CURRENT_SESSION_COOKIE, clearCurrentSession } from "@/lib/authSession";

export async function POST() {
  clearCurrentSession();

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(CURRENT_SESSION_COOKIE);

  return response;
}
