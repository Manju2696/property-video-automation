import { NextResponse } from "next/server";
import fs from "fs/promises";
import { guardAuth } from "@/lib/api";
import { MUSIC_DIR } from "@/lib/paths";

export async function GET() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    await fs.mkdir(MUSIC_DIR, { recursive: true });
    const files = await fs.readdir(MUSIC_DIR);
    const tracks = files.filter((f) => f.toLowerCase().endsWith(".mp3"));
    return NextResponse.json({ tracks: ["None", ...tracks] });
  } catch {
    return NextResponse.json({ tracks: ["None"] });
  }
}
