import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { DATA_DIR } from "./paths";

/**
 * Persist an uploaded file. On Vercel use Blob (durable); locally write under data/.
 * Returns the value to store in Photo.filePath (https URL or relative path).
 */
export async function saveUploadFile(
  relativePath: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const cleaned = relativePath.replace(/^\/+/, "").replace(/\\/g, "/");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(cleaned, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return blob.url;
  }

  const abs = path.join(DATA_DIR, cleaned);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return cleaned;
}

export function isRemoteUrl(filePath: string) {
  return /^https?:\/\//i.test(filePath);
}
