-- CreateTable
CREATE TABLE "Agent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "photoPath" TEXT,
    "logoPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Project" (
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

-- CreateTable
CREATE TABLE "Photo" (
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
