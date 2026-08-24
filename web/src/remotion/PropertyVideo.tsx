import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Series,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  CROSSFADE_SEC,
  FPS,
  INTRO_DURATION_SEC,
  OUTRO_DURATION_SEC,
} from "../lib/constants";
import { INTRO_COMPONENTS } from "./intros";
import { OUTRO_COMPONENTS } from "./outros";
import { PhotoSlide } from "./PhotoSlide";
import type { PropertyVideoProps } from "./types";
import { defaultVideoProps } from "./types";

function CrossfadeWrapper({
  children,
  durationInFrames,
  fadeIn = true,
  fadeOut = true,
}: {
  children: React.ReactNode;
  durationInFrames: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}) {
  const frame = useCurrentFrame();
  const fade = Math.round(CROSSFADE_SEC * FPS);
  const opacity = interpolate(
    frame,
    [0, fade, durationInFrames - fade, durationInFrames],
    [fadeIn ? 0 : 1, 1, 1, fadeOut ? 0 : 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

function IntroFadeOut({
  children,
  durationInFrames,
  fade,
}: {
  children: React.ReactNode;
  durationInFrames: number;
  fade: number;
}) {
  const frame = useCurrentFrame();
  const fadeStart = Math.max(0, durationInFrames - fade);
  const opacity = interpolate(
    frame,
    [fadeStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

function photoSectionFrames(
  photoCount: number,
  photoFrames: number,
  fade: number,
) {
  const n = Math.max(photoCount, 1);
  return n * photoFrames - Math.max(0, n - 1) * fade;
}

/** Intro Template A right column: top = Front View (best full-house), bottom = Living Room */
function pickIntroPhotos(
  photos: { src: string; roomType: string; confidence?: number }[],
): string[] {
  const withSrc = photos.filter((p) => Boolean(p.src));
  if (withSrc.length === 0) return [];

  const ofType = (type: string) =>
    withSrc
      .filter((p) => p.roomType.toLowerCase() === type.toLowerCase())
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  const front =
    ofType("Front View")[0] ||
    ofType("Aerial View")[0] ||
    withSrc[0];
  const living =
    ofType("Living Room")[0] ||
    withSrc.find((p) => p.src !== front.src) ||
    withSrc[0];

  const used = new Set([front.src, living.src]);
  const rest = withSrc.filter((p) => !used.has(p.src)).map((p) => p.src);

  return [front.src, living.src, ...rest].slice(0, 4);
}

export const PropertyVideo: React.FC<PropertyVideoProps> = (props) => {
  const p = { ...defaultVideoProps, ...props };
  const introFrames = INTRO_DURATION_SEC * FPS;
  const outroFrames = OUTRO_DURATION_SEC * FPS;
  const photoFrames = Math.round(p.photoDurationSec * FPS);
  const fade = Math.round(CROSSFADE_SEC * FPS);
  const photos = useMemo(
    () =>
      p.photos.length
        ? p.photos
        : [
            {
              src: "",
              roomType: "Living Room",
              zoomDirection: "in" as const,
            },
          ],
    [p.photos],
  );

  const Intro = INTRO_COMPONENTS[p.introTemplate] || INTRO_COMPONENTS.A;
  const Outro = OUTRO_COMPONENTS[p.outroTemplate] || OUTRO_COMPONENTS["1"];

  const introPhotoSrcs = useMemo(() => pickIntroPhotos(photos), [photos]);

  const firstPhotoSrc = photos[0]?.src || "";
  const bg = firstPhotoSrc || null;

  // Dissolve intro → first photo; Series length must match photoSectionFrames
  // (each slide = photoFrames, overlap = fade via offset)
  const photosStart = introFrames - fade;
  const photosLength = photoSectionFrames(photos.length, photoFrames, fade);
  const outroStart = photosStart + photosLength;
  const totalFrames = outroStart + outroFrames;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence durationInFrames={introFrames}>
        <IntroFadeOut durationInFrames={introFrames} fade={fade}>
          <Intro
            propertyName={p.propertyName}
            beds={p.beds}
            baths={p.baths}
            sqftLabel={p.sqftLabel}
            priceLabel={p.priceLabel}
            photos={introPhotoSrcs}
            bedIcon={p.bedIcon}
            bathIcon={p.bathIcon}
            sqftIcon={p.sqftIcon}
          />
        </IntroFadeOut>
      </Sequence>

      <Sequence from={photosStart}>
        <Series>
          {photos.map((photo, index) => (
            <Series.Sequence
              key={`${photo.src}-${index}`}
              durationInFrames={photoFrames}
              offset={index === 0 ? 0 : -fade}
            >
              <CrossfadeWrapper
                durationInFrames={photoFrames}
                fadeIn
                fadeOut={index < photos.length - 1}
              >
                {photo.src ? (
                  <PhotoSlide photo={photo} zoomIntensity={p.zoomIntensity} />
                ) : (
                  <AbsoluteFill style={{ backgroundColor: "#222" }} />
                )}
              </CrossfadeWrapper>
            </Series.Sequence>
          ))}
        </Series>
      </Sequence>

      <Sequence from={outroStart} durationInFrames={outroFrames}>
        <Outro
          propertyName="Better Homes and Gardens Real Estate"
          heading={p.heading}
          agentName={p.agentName}
          agentPhone={p.agentPhone}
          agentEmail={p.agentEmail}
          agentInitials={p.agentInitials}
          backgroundSrc={bg}
        />
      </Sequence>

      {p.musicUrl ? (
        <Audio
          src={p.musicUrl}
          volume={(f) => {
            const fadeOutStart = totalFrames - FPS * 2;
            const base = p.musicVolume;
            if (f < fadeOutStart) return base;
            return interpolate(f, [fadeOutStart, totalFrames], [base, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export function getCompositionDuration(props: PropertyVideoProps) {
  const p = { ...defaultVideoProps, ...props };
  const introFrames = INTRO_DURATION_SEC * FPS;
  const outroFrames = OUTRO_DURATION_SEC * FPS;
  const photoFrames = Math.round(p.photoDurationSec * FPS);
  const fade = Math.round(CROSSFADE_SEC * FPS);
  const photoSection = photoSectionFrames(
    p.photos.length || 1,
    photoFrames,
    fade,
  );
  return introFrames + photoSection + outroFrames - fade;
}
