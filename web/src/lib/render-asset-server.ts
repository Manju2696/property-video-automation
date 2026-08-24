import http from "http";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR } from "./paths";

function contentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

/**
 * Temporary localhost server for Remotion renders.
 * Avoids file:// URLs breaking on paths that contain spaces.
 */
export function startRenderAssetServer(): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const publicDir = path.join(process.cwd(), "public");

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const decoded = decodeURIComponent(url.pathname);
      let filePath: string;

      if (decoded.startsWith("/data/")) {
        filePath = path.resolve(DATA_DIR, decoded.slice("/data/".length));
        if (!filePath.startsWith(path.resolve(DATA_DIR))) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }
      } else {
        filePath = path.resolve(publicDir, decoded.replace(/^\/+/, ""));
        if (!filePath.startsWith(path.resolve(publicDir))) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }
      }

      const data = await fs.readFile(filePath);
      res.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise<void>((resClose, rejClose) => {
            server.close((err) => (err ? rejClose(err) : resClose()));
          }),
      });
    });
  });
}
