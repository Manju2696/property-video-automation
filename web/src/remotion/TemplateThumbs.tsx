import React from "react";
import { AbsoluteFill } from "remotion";
import { INTRO_COMPONENTS } from "./intros";
import { OUTRO_COMPONENTS } from "./outros";
import type { IntroProps, OutroProps } from "./types";

export type IntroThumbProps = IntroProps & { templateId: string };

export const IntroThumb: React.FC<IntroThumbProps> = ({
  templateId,
  ...props
}) => {
  const Comp = INTRO_COMPONENTS[templateId] || INTRO_COMPONENTS.A;
  return (
    <AbsoluteFill>
      <Comp {...props} />
    </AbsoluteFill>
  );
};

export type OutroThumbProps = OutroProps & { templateId: string };

export const OutroThumb: React.FC<OutroThumbProps> = ({
  templateId,
  ...props
}) => {
  const Comp = OUTRO_COMPONENTS[templateId] || OUTRO_COMPONENTS["1"];
  return (
    <AbsoluteFill>
      <Comp {...props} />
    </AbsoluteFill>
  );
};
