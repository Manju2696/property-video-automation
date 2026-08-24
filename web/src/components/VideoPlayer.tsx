"use client";

import { Player } from "@remotion/player";
import { useMemo } from "react";
import { PropertyVideo, getCompositionDuration } from "@/remotion/PropertyVideo";
import type { PropertyVideoProps } from "@/remotion/types";
import { FPS } from "@/lib/constants";

export function VideoPlayer({
  props,
  orientation = "landscape",
}: {
  props: PropertyVideoProps;
  orientation?: "landscape" | "vertical";
}) {
  const durationInFrames = useMemo(
    () => getCompositionDuration(props),
    [props],
  );

  const width = orientation === "vertical" ? 1080 : 1920;
  const height = orientation === "vertical" ? 1920 : 1080;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-black shadow-sm">
      <Player
        component={PropertyVideo}
        inputProps={props}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={FPS}
        style={{ width: "100%", aspectRatio: `${width}/${height}` }}
        controls
        loop
        acknowledgeRemotionLicense
      />
    </div>
  );
}
