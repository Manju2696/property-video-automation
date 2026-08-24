import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { guardAuth, jsonError } from "@/lib/api";
import { projectExportDir } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import { buildVideoProps, serializeProject } from "@/lib/project-video";
import { startRenderAssetServer } from "@/lib/render-asset-server";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 300;

export async function POST(req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;

  const { id } = await ctx.params;
  const projectId = Number(id);
  const body = await req.json().catch(() => ({}));
  const format = String(body.format || "landscape");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
  });
  if (!project) return jsonError("Project not found", 404);

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "rendering" },
  });

  const exportDir = projectExportDir(projectId);
  await fs.mkdir(exportDir, { recursive: true });

  const entry = path.join(process.cwd(), "src", "remotion", "index.ts");
  let assetServer: Awaited<ReturnType<typeof startRenderAssetServer>> | null =
    null;

  try {
    assetServer = await startRenderAssetServer();
    const inputProps = buildVideoProps(project, {
      assetOrigin: assetServer.origin,
    });

    const bundled = await bundle({
      entryPoint: entry,
      webpackOverride: (config) => {
        config.resolve = config.resolve || {};
        config.resolve.alias = {
          ...(config.resolve.alias || {}),
          "@": path.join(process.cwd(), "src"),
        };
        return config;
      },
    });

    const formats =
      format === "both"
        ? (["landscape", "vertical"] as const)
        : format === "vertical"
          ? (["vertical"] as const)
          : (["landscape"] as const);

    const outputs: Record<string, string> = {};

    for (const f of formats) {
      const compositionId =
        f === "vertical" ? "PropertyVideoVertical" : "PropertyVideoLandscape";
      const composition = await selectComposition({
        serveUrl: bundled,
        id: compositionId,
        inputProps,
      });

      const outName = f === "vertical" ? "vertical.mp4" : "landscape.mp4";
      const outPath = path.join(exportDir, outName);

      await renderMedia({
        composition,
        serveUrl: bundled,
        codec: "h264",
        outputLocation: outPath,
        inputProps,
        crf: 18,
      });

      outputs[f] = `/api/media/exports/${projectId}/${outName}`;
    }

    const full = await prisma.project.update({
      where: { id: projectId },
      data: { status: "done" },
      include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
    });

    return NextResponse.json({
      project: serializeProject(full),
      outputs,
    });
  } catch (error) {
    console.error(error);
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "failed" },
    });
    return jsonError(
      error instanceof Error ? error.message : "Render failed",
      500,
    );
  } finally {
    if (assetServer) {
      await assetServer.close().catch(() => undefined);
    }
  }
}
