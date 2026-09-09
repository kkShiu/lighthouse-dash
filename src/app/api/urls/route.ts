import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

// Hostname-pattern check, not DNS resolution — proportionate for an
// authenticated internal dashboard where the threat model is a user with
// dashboard access probing internal infra, not DNS-rebinding attacks.
const PRIVATE_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // link-local / cloud metadata (e.g. 169.254.169.254)
  /\.internal$/i, // Fly.io's internal DNS suffix
];

function isSafeTrackedUrl(parsed: URL): boolean {
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  return !PRIVATE_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
}

export async function GET() {
  const urls = await prisma.url.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      runs: {
        orderBy: { triggeredAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json({ urls });
}

export async function POST(request: Request) {
  const body = await request.json();
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const label = typeof body?.label === "string" ? body.label.trim() : null;

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "url must be a valid absolute URL" }, { status: 400 });
  }

  if (!isSafeTrackedUrl(parsed)) {
    return NextResponse.json(
      { error: "url must not point to a private or internal address" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.url.create({ data: { url, label } });
    return NextResponse.json({ url: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "url is already tracked" }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `failed to add url: ${message}` }, { status: 500 });
  }
}
