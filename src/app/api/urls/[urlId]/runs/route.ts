import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { executeRun } from "@/lib/lighthouse/triggerRun";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request, ctx: RouteContext<"/api/urls/[urlId]/runs">) {
  const { urlId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const take = Math.min(Number(searchParams.get("take") ?? 20), 100);

  const runs = await prisma.run.findMany({
    where: { urlId: Number(urlId) },
    orderBy: { triggeredAt: "desc" },
    take,
    omit: { auditsJson: true },
  });

  return NextResponse.json({ runs });
}

export async function POST(_req: Request, ctx: RouteContext<"/api/urls/[urlId]/runs">) {
  const { urlId } = await ctx.params;
  const url = await prisma.url.findUnique({ where: { id: Number(urlId) } });

  if (!url || url.archivedAt) {
    return NextResponse.json({ error: "url not found" }, { status: 404 });
  }

  const inProgress = await prisma.run.findFirst({
    where: { status: { in: ["pending", "running"] } },
  });
  if (inProgress) {
    return NextResponse.json(
      { error: "a run is already in progress" },
      { status: 409 },
    );
  }

  const run = await prisma.run.create({
    data: { urlId: url.id, status: "pending" },
  });

  after(() => executeRun(run.id, url.url));

  return NextResponse.json({ run }, { status: 202 });
}
