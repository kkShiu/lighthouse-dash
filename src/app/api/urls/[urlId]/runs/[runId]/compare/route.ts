import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeDeltas } from "@/lib/compare";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/urls/[urlId]/runs/[runId]/compare">,
) {
  const { urlId, runId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const against = searchParams.get("against");

  if (!against) {
    return NextResponse.json({ error: "against query param is required" }, { status: 400 });
  }

  const [runB, runA] = await Promise.all([
    prisma.run.findUnique({ where: { id: Number(runId) } }),
    prisma.run.findUnique({ where: { id: Number(against) } }),
  ]);

  if (!runA || !runB) {
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }

  if (runA.urlId !== Number(urlId) || runB.urlId !== Number(urlId)) {
    return NextResponse.json(
      { error: "both runs must belong to the same url" },
      { status: 400 },
    );
  }

  const deltas = computeDeltas(runA, runB);

  return NextResponse.json({
    runA: { id: runA.id, triggeredAt: runA.triggeredAt, fetchTime: runA.fetchTime },
    runB: { id: runB.id, triggeredAt: runB.triggeredAt, fetchTime: runB.fetchTime },
    deltas,
  });
}
