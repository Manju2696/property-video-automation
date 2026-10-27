import { NextResponse } from "next/server";
import { guardAuth, jsonError } from "@/lib/api";
import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";
import { serializeProject } from "@/lib/project-video";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;
  await ensureDb();

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
  await ensureDb();

  const { id } = await ctx.params;
  const projectId = Number(id);
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
    "introKicker",
    "outroHeading",
    "outroBrand",
    "showIntro",
    "showOutro",
    "showRoomLabels",
    "showIntroAddress",
    "showIntroKicker",
    "showIntroBeds",
    "showIntroBaths",
    "showIntroSqft",
    "showIntroPrice",
  ] as const;

  for (const key of fields) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.musicTrack === "None" || data.musicTrack === "") data.musicTrack = null;

  if (body.agent && typeof body.agent === "object") {
    const agentBody = body.agent as {
      name?: string;
      phone?: string | null;
      email?: string | null;
    };
    const agentData = {
      name: String(agentBody.name || "").trim() || "Your Agent",
      phone: agentBody.phone ? String(agentBody.phone).trim() : null,
      email: agentBody.email ? String(agentBody.email).trim() : null,
    };
    const existing = await prisma.project.findUnique({
      where: { id: projectId },
      select: { agentId: true },
    });
    if (!existing) return jsonError("Project not found", 404);
    if (existing.agentId) {
      await prisma.agent.update({
        where: { id: existing.agentId },
        data: agentData,
      });
    } else {
      const agent = await prisma.agent.create({ data: agentData });
      data.agentId = agent.id;
    }
  }

  const project = await prisma.project.update({
    where: { id: projectId },
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
