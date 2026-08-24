import path from "path";

export const ROOT_DIR = process.cwd();
export const DATA_DIR = path.join(ROOT_DIR, "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
export const EXPORTS_DIR = path.join(DATA_DIR, "exports");
export const MUSIC_DIR = path.join(DATA_DIR, "music");

export function projectUploadDir(projectId: number | string) {
  return path.join(UPLOADS_DIR, String(projectId));
}

export function projectExportDir(projectId: number | string) {
  return path.join(EXPORTS_DIR, String(projectId));
}

export function agentUploadDir(agentId: number | string) {
  return path.join(UPLOADS_DIR, "agents", String(agentId));
}

/** Relative path stored in DB → public media URL for Player */
export function mediaUrl(relativePath: string) {
  const cleaned = relativePath.replace(/^\/+/, "").replace(/\\/g, "/");
  return `/api/media/${cleaned}`;
}

/** Absolute filesystem path from a DB-relative path under data/ */
export function absoluteDataPath(relativePath: string) {
  return path.join(DATA_DIR, relativePath);
}
