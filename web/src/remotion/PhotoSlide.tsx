import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VideoPhoto } from "./types";

export const PhotoSlide: React.FC<{
  photo: VideoPhoto;
  zoomIntensity: number;
  showLabel?: boolean;
}> = ({ photo, zoomIntensity, showLabel = true }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const end = Math.max(durationInFrames - 1, 1);
  const maxZoom = 1 + Math.max(0, zoomIntensity) * 0.25;
  const zooming = maxZoom > 1.001;
  const from = photo.zoomDirection === "out" ? maxZoom : 1.001;
  const to = photo.zoomDirection === "out" ? 1.001 : maxZoom;
  const progress = interpolate(frame, [0, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = zooming ? from + (to - from) * progress : 1.001;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        <Img
          src={photo.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
      {showLabel ? (
        <div
          style={{
            position: "absolute",
            left: 48,
            bottom: 48,
            padding: "14px 22px",
            backgroundColor: "rgba(0,0,0,0.55)",
            color: "#fff",
            fontFamily: "Poppins, sans-serif",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 1,
            borderRadius: 6,
          }}
        >
          {photo.roomType}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
