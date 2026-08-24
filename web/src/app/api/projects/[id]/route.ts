import { NextResponse } from "next/server";
import { guardAuth, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeProject } from "@/lib/project-video";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;

  const { id } = await ctx.params;
  const project = await prisma.project.findUnique({
    where: { id: Number(id) },
    include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
  });
  if (!project) return jsonError("Project not found", 404);
  return NextResponse.json({ project: serializeProject(project) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  const fields = [
    "name",
    "beds",
    "baths",
    "sqft",
    "listingPrice",
    "status",
    "introTemplate",
    "outroTemplate",
    "animationStyle",
    "musicTrack",
    "musicVolume",
    "photoDuration",
    "zoomIntensity",
    "agentId",
  ] as const;

  for (const key of fields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.musicTrack === "None") data.musicTrack = null;

  const project = await prisma.project.update({
    where: { id: Number(id) },
    data,
    include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
  });

  return NextResponse.json({ project: serializeProject(project) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;
  const { id } = await ctx.params;
  await prisma.project.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
