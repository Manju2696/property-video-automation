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
}> = ({ photo, zoomIntensity }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const maxZoom = 1 + zoomIntensity * 0.25;
  const from = photo.zoomDirection === "out" ? maxZoom : 1;
  const to = photo.zoomDirection === "out" ? 1 : maxZoom;
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Img
        src={photo.src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />
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
    </AbsoluteFill>
  );
};
