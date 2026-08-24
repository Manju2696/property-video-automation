import { prisma } from "./prisma";

let ready: Promise<void> | null = null;

/**
 * Local SQLite (/tmp on Vercel was ephemeral — prefer Postgres in production).
 * For file: databases, create tables if missing.
 */
export function ensureDb() {
  if (!ready) {
    ready = (async () => {
      const url = process.env.DATABASE_URL || "";
      if (!url.startsWith("file:")) {
        // Postgres / Neon — schema applied via prisma migrate / db push
        return;
      }

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Agent" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL,
          "phone" TEXT,
          "email" TEXT,
          "photoPath" TEXT,
          "logoPath" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Project" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "name" TEXT NOT NULL,
          "beds" INTEGER,
          "baths" INTEGER,
          "sqft" INTEGER,
          "listingPrice" REAL,
          "agentId" INTEGER,
          "status" TEXT NOT NULL DEFAULT 'uploading',
          "introTemplate" TEXT NOT NULL DEFAULT 'A',
          "outroTemplate" TEXT NOT NULL DEFAULT '1',
          "animationStyle" TEXT NOT NULL DEFAULT 'fade_in',
          "musicTrack" TEXT,
          "musicVolume" REAL NOT NULL DEFAULT 0.5,
          "photoDuration" REAL NOT NULL DEFAULT 4.0,
          "zoomIntensity" REAL NOT NULL DEFAULT 1.2,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          CONSTRAINT "Project_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Photo" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "projectId" INTEGER NOT NULL,
          "filePath" TEXT NOT NULL,
          "roomType" TEXT,
          "confidence" REAL,
          "sequenceOrder" INTEGER,
          "zoomDirection" TEXT NOT NULL DEFAULT 'in',
          "isVisible" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}
