import { NextResponse } from "next/server";
import { guardAuth, jsonError } from "@/lib/api";
import { ensureDb } from "@/lib/ensure-db";
import { prisma } from "@/lib/prisma";
import { serializeProject } from "@/lib/project-video";
import { saveUploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authError = await guardAuth();
  if (authError) return authError;
  await ensureDb();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const projects = await prisma.project.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: {
      agent: true,
      photos: { orderBy: { sequenceOrder: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    projects: projects.map(serializeProject),
  });
}

export async function POST(req: Request) {
  const authError = await guardAuth();
  if (authError) return authError;
  await ensureDb();

  let form: FormData;
  try {
    form = await req.formData();
  } catch (error) {
    console.error("Failed to parse upload FormData", error);
    return jsonError(
      "Upload too large for this host. Photos are uploaded in batches — retry, or use the local app for big batches.",
      413,
    );
  }

  const name = String(form.get("name") || "").trim();
  if (!name) return jsonError("Property name is required");

  const beds = Number(form.get("beds") || 0);
  const baths = Number(form.get("baths") || 0);
  const sqft = Number(form.get("sqft") || 0);
  const listingPrice = Number(form.get("listingPrice") || 0);
  const introTemplate = String(form.get("introTemplate") || "A");
  const outroTemplate = String(form.get("outroTemplate") || "1");
  const animationStyle = String(form.get("animationStyle") || "fade_in");
  const musicTrack = String(form.get("musicTrack") || "None");
  const musicVolume = Number(form.get("musicVolume") || 50) / 100;
  const photoDuration = Number(form.get("photoDuration") || 4);

  let agentId: number | null = null;
  const existingAgentId = form.get("agentId");
  if (existingAgentId) {
    agentId = Number(existingAgentId);
  } else {
    const agentName = String(form.get("agentName") || "").trim();
    if (agentName) {
      const agent = await prisma.agent.create({
        data: {
          name: agentName,
          phone: String(form.get("agentPhone") || "") || null,
          email: String(form.get("agentEmail") || "") || null,
        },
      });
      agentId = agent.id;
    }
  }

  const project = await prisma.project.create({
    data: {
      name,
      beds: Number.isFinite(beds) ? beds : null,
      baths: Number.isFinite(baths) ? baths : null,
      sqft: Number.isFinite(sqft) ? sqft : null,
      listingPrice: Number.isFinite(listingPrice) ? listingPrice : null,
      agentId,
      status: "processing",
      introTemplate,
      outroTemplate,
      animationStyle,
      musicTrack: musicTrack === "None" ? null : musicTrack,
      musicVolume,
      photoDuration,
    },
  });

  const files = form
    .getAll("photos")
    .filter((f): f is File => f instanceof File);
  let order = 0;
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${order}_${safe}`;
    const rel = `uploads/${project.id}/${filename}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const stored = await saveUploadFile(rel, buf, file.type || "image/jpeg");
    await prisma.photo.create({
      data: {
        projectId: project.id,
        filePath: stored,
        sequenceOrder: order,
        roomType: "Other",
        confidence: 0,
      },
    });
    order += 1;
  }

  const full = await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    include: { agent: true, photos: true },
  });

  return NextResponse.json({ project: serializeProject(full) });
}
