import { NextResponse } from "next/server";
import { CURRENT_SESSION_COOKIE, setCurrentSession } from "@/lib/authSession";

export async function POST(request: Request) {
  const body = await request.json();
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validUsername || !validPassword || username !== validUsername || password !== validPassword) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const token = crypto.randomUUID();
  setCurrentSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CURRENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
