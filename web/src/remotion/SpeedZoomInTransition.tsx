import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** Fast zoom-in punch used right after the intro — no fade-from-black. */
export const SpeedZoomInTransition: React.FC<{
  src: string;
}> = ({ src }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Punch zoom: start near full-frame, slam in — always fully visible
  const scale = interpolate(progress, [0, 1], [1.0, 1.45]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {src ? (
        <Img
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <AbsoluteFill style={{ backgroundColor: "#111" }} />
      )}
    </AbsoluteFill>
  );
};
