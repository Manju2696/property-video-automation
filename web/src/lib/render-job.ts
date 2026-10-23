import fs from "fs/promises";
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { absoluteDataPath, projectExportDir } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import { buildVideoProps } from "@/lib/project-video";
import { startRenderAssetServer } from "@/lib/render-asset-server";

export type RenderFormat = "landscape" | "vertical" | "both";

export type RenderJob = {
  status: "rendering" | "done" | "failed";
  progress: number;
  label: string;
  error?: string;
  warning?: string;
  outputs?: Record<string, string>;
};

const jobs = new Map<number, RenderJob>();

export function getRenderJob(projectId: number) {
  return jobs.get(projectId) ?? null;
}

export function beginRender(projectId: number): {
  job: RenderJob;
  started: boolean;
} {
  const current = jobs.get(projectId);
  if (current?.status === "rendering") return { job: current, started: false };

  const job: RenderJob = {
    status: "rendering",
    progress: 0,
    label: "Preparing the video",
  };
  jobs.set(projectId, job);
  return { job, started: true };
}

export async function executeRender(
  projectId: number,
  format: RenderFormat,
  job: RenderJob,
) {
  let assetServer: Awaited<ReturnType<typeof startRenderAssetServer>> | null =
    null;

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "rendering" },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { agent: true, photos: { orderBy: { sequenceOrder: "asc" } } },
    });
    if (!project) throw new Error("Project not found");

    const exportDir = projectExportDir(projectId);
    await fs.mkdir(exportDir, { recursive: true });

    assetServer = await startRenderAssetServer();
    const inputProps = buildVideoProps(project, {
      assetOrigin: assetServer.origin,
    });

    if (project.musicTrack && project.musicTrack !== "None") {
      const musicFile = absoluteDataPath(
        path.join("music", project.musicTrack),
      );
      try {
        await fs.access(musicFile);
      } catch {
        inputProps.musicUrl = null;
        job.warning = `${project.musicTrack} is not on the server, so this video has no music.`;
        console.warn(job.warning);
      }
    }

    const visiblePhotos = inputProps.photos.length;
    console.log(
      `Render start project ${projectId}: ${visiblePhotos} photos, format ${format}`,
    );

    const bundled = await bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.ts"),
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

    for (let index = 0; index < formats.length; index++) {
      const f = formats[index];
      const compositionId =
        f === "vertical" ? "PropertyVideoVertical" : "PropertyVideoLandscape";
      const composition = await selectComposition({
        serveUrl: bundled,
        id: compositionId,
        inputProps,
        timeoutInMilliseconds: 120000,
      });

      const outName = f === "vertical" ? "vertical.mp4" : "landscape.mp4";
      const outPath = path.join(exportDir, outName);
      let lastLogged = -1;

      console.log(
        `Render ${f} project ${projectId}: ${composition.durationInFrames} frames`,
      );

      await renderMedia({
        composition,
        serveUrl: bundled,
        codec: "h264",
        outputLocation: outPath,
        inputProps,
        crf: 18,
        imageFormat: "jpeg",
        jpegQuality: 80,
        x264Preset: "fast",
        concurrency: 2,
        timeoutInMilliseconds: 120000,
        onProgress: ({ progress }) => {
          const overall = Math.round(
            ((index + progress) / formats.length) * 100,
          );
          job.progress = overall;
          job.label = `Rendering ${f} video`;
          if (overall >= lastLogged + 10) {
            lastLogged = overall;
            console.log(`Render project ${projectId} ${f} ${overall}%`);
          }
        },
      });

      outputs[f] = `/api/media/exports/${projectId}/${outName}`;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "done" },
    });

    job.status = "done";
    job.progress = 100;
    job.label = "Ready";
    job.outputs = outputs;
    console.log(`Render done project ${projectId}`);
  } catch (error) {
    console.error(error);
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Render failed";
    job.label = "Failed";
    await prisma.project
      .update({
        where: { id: projectId },
        data: { status: "failed" },
      })
      .catch(() => undefined);
  } finally {
    if (assetServer) {
      await assetServer.close().catch(() => undefined);
    }
  }
}
