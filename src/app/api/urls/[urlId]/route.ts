import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/urls/[urlId]">) {
  const { urlId } = await ctx.params;
  const url = await prisma.url.findUnique({ where: { id: Number(urlId) } });

  if (!url) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ url });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/urls/[urlId]">) {
  const { urlId } = await ctx.params;
  const body = await request.json();
  const data: { label?: string | null; archivedAt?: Date | null } = {};

  if ("label" in body) data.label = typeof body.label === "string" ? body.label.trim() : null;
  if ("archived" in body) data.archivedAt = body.archived ? new Date() : null;

  const updated = await prisma.url.update({ where: { id: Number(urlId) }, data });
  return NextResponse.json({ url: updated });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/urls/[urlId]">) {
  const { urlId } = await ctx.params;
  await prisma.run.deleteMany({ where: { urlId: Number(urlId) } });
  await prisma.url.delete({ where: { id: Number(urlId) } });
  return NextResponse.json({ ok: true });
}
