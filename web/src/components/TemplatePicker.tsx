"use client";

import { Thumbnail } from "@remotion/player";
import { INTRO_TEMPLATES, OUTRO_TEMPLATES, FPS } from "@/lib/constants";
import { IntroThumb, OutroThumb } from "@/remotion/TemplateThumbs";

const INTRO_FRAME = Math.round(2.8 * FPS); // mid-animation, matches old HTML preview
const OUTRO_FRAME = Math.round(2.6 * FPS);
const DURATION = 5 * FPS;

export type TemplatePickerPreview = {
  propertyName?: string;
  beds?: number;
  baths?: number;
  sqftLabel?: string;
  priceLabel?: string;
  photos?: string[];
  /** When provided, intro thumbnails prefer Front View + Living Room */
  photoItems?: { src: string; roomType: string }[];
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  agentInitials?: string;
  kicker?: string;
  heading?: string;
  brand?: string;
  showAddress?: boolean;
  showKicker?: boolean;
  showBeds?: boolean;
  showBaths?: boolean;
  showSqft?: boolean;
  showPrice?: boolean;
};

function pickIntroPhotoUrls(
  items: { src: string; roomType: string }[],
  fallback: string[],
): string[] {
  const withSrc = items.filter((p) => Boolean(p.src));
  if (withSrc.length === 0) return fallback.slice(0, 4);

  const byType = (type: string) =>
    withSrc.find((p) => p.roomType.toLowerCase() === type.toLowerCase());

  const front = byType("Front View") || byType("Aerial View") || withSrc[0];
  const living =
    byType("Living Room") ||
    withSrc.find((p) => p.src !== front.src) ||
    withSrc[0];
  const used = new Set([front.src, living.src]);
  const rest = withSrc.filter((p) => !used.has(p.src)).map((p) => p.src);
  const picked = [front.src, living.src, ...rest];
  while (picked.length < 4) picked.push(picked[picked.length - 1] || fallback[0]);
  return picked.slice(0, 4);
}

const DEFAULT_PHOTO = "/placeholder-photo.jpg";

export function TemplatePicker({
  kind,
  value,
  onChange,
  preview,
}: {
  kind: "intro" | "outro";
  value: string;
  onChange: (id: string) => void;
  preview?: TemplatePickerPreview;
}) {
  const map = kind === "intro" ? INTRO_TEMPLATES : OUTRO_TEMPLATES;
  const fallbackPhotos = (
    preview?.photos?.length
      ? preview.photos
      : [DEFAULT_PHOTO, DEFAULT_PHOTO, DEFAULT_PHOTO, DEFAULT_PHOTO]
  ).slice(0, 4);

  const photos = preview?.photoItems?.length
    ? pickIntroPhotoUrls(preview.photoItems, fallbackPhotos)
    : [...fallbackPhotos];

  while (photos.length < 4) {
    photos.push(photos[0] || DEFAULT_PHOTO);
  }

  const introBase = {
    propertyName: preview?.propertyName || "123 Maple Street",
    beds: preview?.beds ?? 4,
    baths: preview?.baths ?? 3,
    sqftLabel: preview?.sqftLabel || "2,450",
    priceLabel: preview?.priceLabel || "$1,250,000",
    photos,
    bedIcon: "/icons/bed.png",
    bathIcon: "/icons/bath.png",
    sqftIcon: "/icons/sqft.png",
    kicker: preview?.kicker ?? "PROPERTY DETAILS",
    showAddress: preview?.showAddress !== false,
    showKicker: preview?.showKicker !== false,
    showBeds: preview?.showBeds !== false,
    showBaths: preview?.showBaths !== false,
    showSqft: preview?.showSqft !== false,
    showPrice: preview?.showPrice !== false,
  };

  const outroBase = {
    propertyName: preview?.brand || "Better Homes and Gardens Real Estate",
    heading: preview?.heading || "SCHEDULE A SHOWING TODAY",
    agentName: preview?.agentName || "Alex Morgan",
    agentPhone: preview?.agentPhone || "(555) 010-2000",
    agentEmail: preview?.agentEmail || "alex@realty.example",
    agentInitials: preview?.agentInitials || "AM",
    backgroundSrc: photos[0] || DEFAULT_PHOTO,
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {Object.entries(map).map(([id, name]) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`rounded-xl border p-2 text-left transition ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]"
                : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--accent)]"
            }`}
          >
            <div className="mb-2 aspect-video w-full overflow-hidden rounded-lg bg-black">
              {kind === "intro" ? (
                <Thumbnail
                  component={IntroThumb}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  frameToDisplay={INTRO_FRAME}
                  durationInFrames={DURATION}
                  fps={FPS}
                  inputProps={{ ...introBase, templateId: id }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <Thumbnail
                  component={OutroThumb}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  frameToDisplay={OUTRO_FRAME}
                  durationInFrames={DURATION}
                  fps={FPS}
                  inputProps={{ ...outroBase, templateId: id }}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </div>
            <div className="px-1 pb-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--gold)]">
                {kind === "intro" ? `Intro ${id}` : `Outro ${id}`}
              </div>
              <div className="text-sm font-semibold text-[var(--ink)]">{name}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
