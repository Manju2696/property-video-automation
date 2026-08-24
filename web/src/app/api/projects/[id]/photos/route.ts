import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { guardAuth, jsonError } from "@/lib/api";
import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";
import { projectUploadDir } from "@/lib/paths";
import { serializeProject } from "@/lib/project-video";

type Ctx = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const maxDuration = 60;

/** Append photos to an existing project (chunked uploads for Vercel body limits). */
export async function POST(req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;
  await ensureDb();

  const { id } = await ctx.params;
  const projectId = Number(id);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return jsonError("Project not found", 404);

  let form: FormData;
  try {
    form = await req.formData();
  } catch (error) {
    console.error("Failed to parse photo FormData", error);
    return jsonError(
      "Photo too large for this host (max ~4MB per request on Vercel). Use a smaller image.",
      413,
    );
  }

  const startOrder = Number(form.get("startOrder") || 0);
  const uploadDir = projectUploadDir(projectId);
  await fs.mkdir(uploadDir, { recursive: true });

  const files = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  let order = Number.isFinite(startOrder) ? startOrder : 0;
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${order}_${safe}`;
    const abs = path.join(uploadDir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(abs, buf);
    const rel = path
      .join("uploads", String(projectId), filename)
      .replace(/\\/g, "/");
    await prisma.photo.create({
      data: {
        projectId,
        filePath: rel,
        sequenceOrder: order,
        roomType: "Other",
        confidence: 0,
      },
    });
    order += 1;
  }

  const full = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
  });

  return NextResponse.json({ project: serializeProject(full) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;
  await ensureDb();

  const { id } = await ctx.params;
  const projectId = Number(id);
  const body = await req.json().catch(() => ({}));

  if (Array.isArray(body.order)) {
    const order = body.order as number[];
    await prisma.$transaction(
      order.map((photoId, index) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { sequenceOrder: index },
        }),
      ),
    );
  }

  if (body.photoId && body.patch) {
    const photo = await prisma.photo.findFirst({
      where: { id: Number(body.photoId), projectId },
    });
    if (!photo) return jsonError("Photo not found", 404);
    const patch = body.patch as Record<string, unknown>;
    await prisma.photo.update({
      where: { id: photo.id },
      data: {
        roomType: patch.roomType !== undefined ? String(patch.roomType) : undefined,
        zoomDirection:
          patch.zoomDirection !== undefined
            ? String(patch.zoomDirection)
            : undefined,
        isVisible:
          patch.isVisible !== undefined ? Boolean(patch.isVisible) : undefined,
        sequenceOrder:
          patch.sequenceOrder !== undefined
            ? Number(patch.sequenceOrder)
            : undefined,
      },
    });
  }

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
  });

  return NextResponse.json({ project: serializeProject(project) });
}
