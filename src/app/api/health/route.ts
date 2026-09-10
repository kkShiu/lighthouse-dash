import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/version";

export function GET() {
  return NextResponse.json({ ok: true, version: APP_VERSION });
}
