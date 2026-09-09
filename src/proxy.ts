import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CURRENT_SESSION_COOKIE, isValidSession } from "@/lib/authSession";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(CURRENT_SESSION_COOKIE)?.value;
  if (isValidSession(token)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!api/health|api/login|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
