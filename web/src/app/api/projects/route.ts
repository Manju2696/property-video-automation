import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { guardAuth, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeProject } from "@/lib/project-video";
import { projectUploadDir } from "@/lib/paths";

export async function GET(req: Request) {
  const authError = await guardAuth();
  if (authError) return authError;

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

  let form: FormData;
  try {
    form = await req.formData();
  } catch (error) {
    console.error("Failed to parse upload FormData", error);
    return jsonError(
      "Upload too large or incomplete. Try fewer / smaller photos (under ~80MB total).",
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

  const uploadDir = projectUploadDir(project.id);
  await fs.mkdir(uploadDir, { recursive: true });

  const files = form.getAll("photos").filter((f): f is File => f instanceof File);
  let order = 0;
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${order}_${safe}`;
    const abs = path.join(uploadDir, filename);
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(abs, buf);
    const rel = path.join("uploads", String(project.id), filename).replace(/\\/g, "/");
    await prisma.photo.create({
      data: {
        projectId: project.id,
        filePath: rel,
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
