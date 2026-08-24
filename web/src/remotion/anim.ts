import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const ease = Easing.out(Easing.cubic);

function range(delayMs: number, durationMs: number, fps: number) {
  const start = (delayMs / 1000) * fps;
  const end = start + (durationMs / 1000) * fps;
  return { start, end };
}

export function useFadeIn(delayMs: number, durationMs = 700) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  return {
    opacity: interpolate(frame, [start, end], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    }),
  };
}

export function useFadeOut(delayMs: number, durationMs = 700) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  return {
    opacity: interpolate(frame, [start, end], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    }),
  };
}

export function useSlideUp(delayMs: number, durationMs = 700, distance = 30) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return {
    opacity: t,
    transform: `translateY(${(1 - t) * distance}px)`,
  };
}

export function useSlideLeft(delayMs: number, durationMs = 700, distance = 40) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return {
    opacity: t,
    transform: `translateX(${(1 - t) * -distance}px)`,
  };
}

export function useSlideRight(delayMs: number, durationMs = 700, distance = 30) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return {
    opacity: t,
    transform: `translateX(${(1 - t) * distance}px)`,
  };
}

export function useScalePop(delayMs: number, durationMs = 700) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const scale = 0.75 + Math.min(1, t * 1.15) * 0.25;
  return {
    opacity: t,
    transform: `scale(${scale})`,
  };
}

export function useWidthGrow(delayMs: number, durationMs = 700, maxPx = 60) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  const width = interpolate(frame, [start, end], [0, maxPx], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return { width };
}

export function useStripSlideIn(delayMs = 0, durationMs = 800) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { start, end } = range(delayMs, durationMs, fps);
  const left = interpolate(frame, [start, end], [-1920, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return { left };
}

/** Back-compat aliases used by older template code */
export const useFadeSlide = useSlideUp;

export const GOLD = "#c8a45e";
export const INK = "#1a1a1a";
export const FONT = "Poppins, sans-serif";
export const SERIF = "Playfair Display, Georgia, serif";
