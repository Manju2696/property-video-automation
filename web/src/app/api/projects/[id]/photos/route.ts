import { NextResponse } from "next/server";
import { guardAuth, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeProject } from "@/lib/project-video";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;

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
