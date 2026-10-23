"use client";

import { Player } from "@remotion/player";
import { useEffect, useMemo } from "react";
import { prefetch } from "remotion";
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

  const assetKey = [
    ...props.photos.map((photo) => photo.src),
    props.bedIcon,
    props.bathIcon,
    props.sqftIcon,
    props.musicUrl || "",
  ].join("|");

  useEffect(() => {
    const urls = assetKey.split("|").filter(Boolean);
    const jobs = urls.map((url) => prefetch(url));
    return () => {
      for (const job of jobs) job.free();
    };
  }, [assetKey]);

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
