-- CreateSchema
CREATE TABLE "Agent" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "photoPath" TEXT,
    "logoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "beds" INTEGER,
    "baths" INTEGER,
    "sqft" INTEGER,
    "listingPrice" DOUBLE PRECISION,
    "agentId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'uploading',
    "introTemplate" TEXT NOT NULL DEFAULT 'A',
    "outroTemplate" TEXT NOT NULL DEFAULT '1',
    "animationStyle" TEXT NOT NULL DEFAULT 'fade_in',
    "musicTrack" TEXT,
    "musicVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "photoDuration" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "zoomIntensity" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "roomType" TEXT,
    "confidence" DOUBLE PRECISION,
    "sequenceOrder" INTEGER,
    "zoomDirection" TEXT NOT NULL DEFAULT 'in',
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
