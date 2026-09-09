import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

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

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "url must be a valid absolute URL" }, { status: 400 });
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
