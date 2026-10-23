import {
  CROSSFADE_SEC,
  FPS,
  INTRO_DURATION_SEC,
  OUTRO_DURATION_SEC,
} from "./constants";

export type TimelineInput = {
  photoCount: number;
  photoDurationSec: number;
  showIntro: boolean;
  showOutro: boolean;
};

export function videoTimeline(input: TimelineInput) {
  const fade = Math.round(CROSSFADE_SEC * FPS);
  const introFrames = input.showIntro ? INTRO_DURATION_SEC * FPS : 0;
  const outroFrames = input.showOutro ? OUTRO_DURATION_SEC * FPS : 0;
  const photoFrames = Math.max(
    fade + 2,
    Math.round(Math.max(input.photoDurationSec, 0.5) * FPS),
  );
  const count = Math.max(input.photoCount, 1);
  const photoSection = count * photoFrames - Math.max(0, count - 1) * fade;
  const introOverlap = input.showIntro ? Math.min(fade, introFrames) : 0;
  const outroOverlap = input.showOutro ? Math.min(fade, outroFrames) : 0;
  const photosStart = introFrames - introOverlap;
  const outroStart = photosStart + photoSection - outroOverlap;
  const totalFrames = Math.max(1, outroStart + outroFrames);

  return {
    fade,
    introFrames,
    outroFrames,
    photoFrames,
    photoSection,
    photosStart,
    outroStart,
    totalFrames,
    /** Frames between the start of one photo and the next. */
    step: photoFrames - fade,
  };
}
