import type { Agent, Photo, Project } from "@prisma/client";
import path from "path";
import { pathToFileURL } from "url";
import type { PropertyVideoProps } from "@/remotion/types";
import {
  CROSSFADE_SEC,
  FPS,
  INTRO_DURATION_SEC,
  OUTRO_DURATION_SEC,
} from "./constants";
import { agentInitials, formatPrice, formatSqft } from "./format";
import { absoluteDataPath, mediaUrl } from "./paths";

export type ProjectWithRelations = Project & {
  agent: Agent | null;
  photos: Photo[];
};

function publicAssetUrl(
  assetPath: string,
  absolute: boolean,
  assetOrigin?: string,
) {
  if (assetOrigin) {
    return `${assetOrigin}/${assetPath.replace(/^\/+/, "")}`;
  }
  if (absolute) {
    return pathToFileURL(path.join(process.cwd(), "public", assetPath)).href;
  }
  return `/${assetPath}`;
}

export function photoPublicUrl(photo: Photo) {
  return mediaUrl(photo.filePath);
}

export function serializeProject(project: ProjectWithRelations) {
  const photos = [...project.photos].sort(
    (a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0),
  );
  return {
    ...project,
    photos: photos.map((p) => ({
      ...p,
      url: photoPublicUrl(p),
    })),
    agent: project.agent
      ? {
          ...project.agent,
          initials: agentInitials(project.agent.name),
        }
      : null,
  };
}

export function buildVideoProps(
  project: ProjectWithRelations,
  options: { absoluteUrls?: boolean; assetOrigin?: string } = {},
): PropertyVideoProps {
  let photos = [...project.photos]
    .filter((p) => p.isVisible)
    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

  // Lead with the best full-house Front View when present (porch close-ups
  // may also be labeled Front View with lower confidence).
  const frontViews = photos.filter(
    (p) => (p.roomType || "").toLowerCase() === "front view",
  );
  if (frontViews.length > 0) {
    const hero = [...frontViews].sort(
      (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0),
    )[0];
    photos = [hero, ...photos.filter((p) => p.id !== hero.id)];
  }

  const toUrl = (rel: string) => {
    const cleaned = rel.replace(/^\/+/, "").replace(/\\/g, "/");
    if (options.assetOrigin) {
      return `${options.assetOrigin}/data/${cleaned}`;
    }
    if (options.absoluteUrls) {
      return pathToFileURL(absoluteDataPath(cleaned)).href;
    }
    return mediaUrl(cleaned);
  };

  const photoProps = photos.map((p) => ({
    src: toUrl(p.filePath),
    roomType: p.roomType || "Other",
    zoomDirection: (p.zoomDirection === "out" ? "out" : "in") as "in" | "out",
    confidence: p.confidence ?? undefined,
  }));

  let musicUrl: string | null = null;
  if (project.musicTrack && project.musicTrack !== "None") {
    const rel = path.join("music", project.musicTrack).replace(/\\/g, "/");
    musicUrl = toUrl(rel);
  }

  const absolute = Boolean(options.absoluteUrls || options.assetOrigin);

  return {
    propertyName: project.name,
    beds: project.beds ?? 0,
    baths: project.baths ?? 0,
    sqftLabel: formatSqft(project.sqft),
    priceLabel: formatPrice(project.listingPrice),
    introTemplate: project.introTemplate || "A",
    outroTemplate: project.outroTemplate || "1",
    photoDurationSec: project.photoDuration || 4,
    zoomIntensity: project.zoomIntensity || 1.2,
    photos: photoProps,
    agentName: project.agent?.name || "Your Agent",
    agentPhone: project.agent?.phone || "",
    agentEmail: project.agent?.email || "",
    agentInitials: agentInitials(project.agent?.name || "Agent"),
    heading: "SCHEDULE A SHOWING TODAY",
    bedIcon: publicAssetUrl("icons/bed.png", absolute, options.assetOrigin),
    bathIcon: publicAssetUrl("icons/bath.png", absolute, options.assetOrigin),
    sqftIcon: publicAssetUrl("icons/sqft.png", absolute, options.assetOrigin),
    musicUrl,
    musicVolume: project.musicVolume ?? 0.5,
  };
}

export function calcDurationInFrames(props: PropertyVideoProps) {
  const intro = INTRO_DURATION_SEC * FPS;
  const outro = OUTRO_DURATION_SEC * FPS;
  const fade = Math.round(CROSSFADE_SEC * FPS);
  const n = Math.max(props.photos.length, 1);
  const photoFrames = Math.round(props.photoDurationSec * FPS) * n;
  const fades = Math.max(0, n - 1) * fade;
  const photoSection = photoFrames - fades;
  return (
    intro +
    Math.max(photoSection, Math.round(props.photoDurationSec * FPS)) +
    outro -
    fade
  );
}
