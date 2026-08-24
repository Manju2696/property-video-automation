import { NextResponse } from "next/server";
import { guardAuth, jsonError } from "@/lib/api";
import { classifyImages, sequencePriority } from "@/lib/classify";
import { absoluteDataPath } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import { serializeProject } from "@/lib/project-video";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 300;

export async function POST(_req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;

  const { id } = await ctx.params;
  const projectId = Number(id);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { photos: true },
  });
  if (!project) return jsonError("Project not found", 404);

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "processing" },
  });

  try {
    const paths = project.photos.map((photo) =>
      absoluteDataPath(photo.filePath),
    );
    const results = await classifyImages(paths, 3);

    await prisma.$transaction(
      project.photos.map((photo, index) =>
        prisma.photo.update({
          where: { id: photo.id },
          data: {
            roomType: results[index].room_type,
            confidence: results[index].confidence,
          },
        }),
      ),
    );

    const refreshed = await prisma.photo.findMany({
      where: { projectId },
    });
    // Room-type priority first; within a type put higher confidence first
    // so the best Front View (full house) leads the video.
    const sorted = [...refreshed].sort((a, b) => {
      const byType =
        sequencePriority(a.roomType) - sequencePriority(b.roomType);
      if (byType !== 0) return byType;
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    });

    await prisma.$transaction(
      sorted.map((photo, index) =>
        prisma.photo.update({
          where: { id: photo.id },
          data: { sequenceOrder: index },
        }),
      ),
    );

    const full = await prisma.project.update({
      where: { id: projectId },
      data: { status: "review" },
      include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
    });

    return NextResponse.json({ project: serializeProject(full) });
  } catch (error) {
    console.error("Classify failed", error);
    const full = await prisma.project.update({
      where: { id: projectId },
      data: { status: "review" },
      include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
    });
    return NextResponse.json({
      project: serializeProject(full),
      warning:
        "Classification failed; photos left as Other so you can edit manually.",
    });
  }
}
