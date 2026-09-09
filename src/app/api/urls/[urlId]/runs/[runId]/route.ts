import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/urls/[urlId]/runs/[runId]">,
) {
  const { runId } = await ctx.params;
  const run = await prisma.run.findUnique({ where: { id: Number(runId) } });

  if (!run) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...run,
    audits: run.auditsJson ? JSON.parse(run.auditsJson) : null,
  });
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/urls/[urlId]/runs/[runId]">,
) {
  const { runId } = await ctx.params;
  await prisma.run.delete({ where: { id: Number(runId) } });
  return NextResponse.json({ ok: true });
}
