import { after, NextResponse } from "next/server";
import { guardAuth, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  beginRender,
  executeRender,
  getRenderJob,
  type RenderFormat,
} from "@/lib/render-job";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function parseFormat(value: unknown): RenderFormat {
  if (value === "vertical" || value === "both") return value;
  return "landscape";
}

export async function GET(_req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;

  const { id } = await ctx.params;
  const projectId = Number(id);
  const job = getRenderJob(projectId);
  if (job) return NextResponse.json(job);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  });
  if (!project) return jsonError("Project not found", 404);

  if (project.status === "rendering") {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "failed" },
    });
    return NextResponse.json({
      status: "failed",
      progress: 0,
      label: "Failed",
      error: "The render was interrupted. Start it again.",
    });
  }

  return NextResponse.json({
    status: "idle",
    progress: 0,
    label: "",
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const authError = await guardAuth();
  if (authError) return authError;

  // Remotion needs Chromium + writable disk; Vercel serverless cannot export MP4s.
  if (process.env.VERCEL) {
    return jsonError(
      "MP4 export is not available on Vercel. Run the app locally (npm run dev) to export, or use Remotion Lambda.",
      501,
    );
  }

  const { id } = await ctx.params;
  const projectId = Number(id);
  const body = await req.json().catch(() => ({}));
  const format = parseFormat(body.format);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) return jsonError("Project not found", 404);

  const { job, started } = beginRender(projectId);
  if (started) {
    const pending = executeRender(projectId, format, job);
    after(() => pending);
  }

  return NextResponse.json(job);
}
