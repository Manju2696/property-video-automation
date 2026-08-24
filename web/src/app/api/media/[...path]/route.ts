import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { guardAuth } from "@/lib/api";
import { DATA_DIR } from "@/lib/paths";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const authError = await guardAuth();
  if (authError) return authError;

  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  if (rel.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const abs = path.join(DATA_DIR, rel);
  if (!abs.startsWith(DATA_DIR)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(abs);
    const ext = path.extname(abs).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".mp4"
            ? "video/mp4"
            : ext === ".mp3"
              ? "audio/mpeg"
              : "image/jpeg";
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
