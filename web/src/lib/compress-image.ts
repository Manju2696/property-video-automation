/** Resize/compress an image so Vercel Hobby (~4.5MB body) can accept it. */
export async function compressImageForUpload(
  file: File,
  options: { maxEdge?: number; quality?: number; maxBytes?: number } = {},
): Promise<File> {
  const maxEdge = options.maxEdge ?? 1920;
  const quality = options.quality ?? 0.82;
  const maxBytes = options.maxBytes ?? 3_500_000;

  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let q = quality;
  let blob: Blob | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", q),
    );
    if (!blob) break;
    if (blob.size <= maxBytes) break;
    q = Math.max(0.5, q - 0.1);
  }

  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/** Pack files into batches that stay under a byte budget. */
export function batchFiles(files: File[], maxBatchBytes = 3_500_000): File[][] {
  const batches: File[][] = [];
  let current: File[] = [];
  let size = 0;

  for (const file of files) {
    if (file.size > maxBatchBytes) {
      if (current.length) {
        batches.push(current);
        current = [];
        size = 0;
      }
      batches.push([file]);
      continue;
    }
    if (current.length && size + file.size > maxBatchBytes) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(file);
    size += file.size;
  }
  if (current.length) batches.push(current);
  return batches;
}
