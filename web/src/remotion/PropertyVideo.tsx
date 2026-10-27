import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { FPS } from "../lib/constants";
import { videoTimeline } from "../lib/timeline";
import { INTRO_COMPONENTS } from "./intros";
import { OUTRO_COMPONENTS } from "./outros";
import { PhotoSlide } from "./PhotoSlide";
import type { PropertyVideoProps } from "./types";
import { defaultVideoProps } from "./types";

function DissolveIn({
  children,
  frames,
}: {
  children: React.ReactNode;
  frames: number;
}) {
  const frame = useCurrentFrame();
  const opacity =
    frames <= 1
      ? 1
      : interpolate(frame, [0, frames - 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
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
  const last = Math.max(durationInFrames - 1, 1);
  const fadeStart = Math.max(0, last - fade + 1);
  if (fadeStart >= last) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const opacity = interpolate(frame, [fadeStart, last], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

/** Intro right column: top = Front View, bottom = Living Room */
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
    ofType("Front View")[0] || ofType("Aerial View")[0] || withSrc[0];
  const living =
    ofType("Living Room")[0] ||
    withSrc.find((p) => p.src !== front.src) ||
    withSrc[0];

  const used = new Set([front.src, living.src]);
  const rest = withSrc.filter((p) => !used.has(p.src)).map((p) => p.src);

  return [front.src, living.src, ...rest].slice(0, 4);
}

function timelineInput(props: PropertyVideoProps) {
  const p = { ...defaultVideoProps, ...props };
  return {
    photoCount: p.photos.length,
    photoDurationSec: p.photoDurationSec,
    showIntro: p.showIntro,
    showOutro: p.showOutro,
  };
}

export const PropertyVideo: React.FC<PropertyVideoProps> = (props) => {
  const p = { ...defaultVideoProps, ...props };
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

  const timeline = videoTimeline({
    ...timelineInput(p),
    photoCount: photos.length,
  });
  const Intro = INTRO_COMPONENTS[p.introTemplate] || INTRO_COMPONENTS.A;
  const Outro = OUTRO_COMPONENTS[p.outroTemplate] || OUTRO_COMPONENTS["1"];
  const introPhotoSrcs = useMemo(() => pickIntroPhotos(photos), [photos]);
  const firstPhotoSrc = photos[0]?.src || "";
  const premount = Math.round(FPS);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {photos.map((photo, index) => {
        const dissolve = index === 0 ? 0 : timeline.fade;
        return (
          <Sequence
            key={`${photo.src}-${index}`}
            from={timeline.photosStart + index * timeline.step}
            durationInFrames={timeline.photoFrames}
            premountFor={index === 0 ? 0 : premount}
          >
            <DissolveIn frames={dissolve}>
              {photo.src ? (
                <PhotoSlide
                  photo={photo}
                  zoomIntensity={p.zoomIntensity}
                  showLabel={p.showRoomLabels}
                />
              ) : (
                <AbsoluteFill style={{ backgroundColor: "#222" }} />
              )}
            </DissolveIn>
          </Sequence>
        );
      })}

      {p.showIntro ? (
        <Sequence durationInFrames={timeline.introFrames}>
          <IntroFadeOut
            durationInFrames={timeline.introFrames}
            fade={timeline.fade}
          >
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
              kicker={p.introKicker}
              showAddress={p.showIntroAddress}
              showKicker={p.showIntroKicker}
              showBeds={p.showIntroBeds}
              showBaths={p.showIntroBaths}
              showSqft={p.showIntroSqft}
              showPrice={p.showIntroPrice}
            />
          </IntroFadeOut>
        </Sequence>
      ) : null}

      {p.showOutro ? (
        <Sequence
          from={timeline.outroStart}
          durationInFrames={timeline.outroFrames}
          premountFor={premount}
        >
          <DissolveIn frames={timeline.fade}>
            <Outro
              propertyName={p.outroBrand}
              heading={p.outroHeading || p.heading}
              agentName={p.agentName}
              agentPhone={p.agentPhone}
              agentEmail={p.agentEmail}
              agentInitials={p.agentInitials}
              backgroundSrc={firstPhotoSrc || null}
            />
          </DissolveIn>
        </Sequence>
      ) : null}

      {p.musicUrl ? (
        <Audio
          src={p.musicUrl}
          volume={(f) => {
            const fadeOutStart = timeline.totalFrames - FPS * 2;
            const base = p.musicVolume;
            if (f < fadeOutStart) return base;
            return interpolate(
              f,
              [fadeOutStart, timeline.totalFrames],
              [base, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            );
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export function getCompositionDuration(props: PropertyVideoProps) {
  const p = { ...defaultVideoProps, ...props };
  return videoTimeline({
    ...timelineInput(p),
    photoCount: Math.max(p.photos.length, 1),
  }).totalFrames;
}
