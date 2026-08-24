import React from "react";
import { Composition, staticFile } from "remotion";
import { FPS, INTRO_DURATION_SEC } from "../lib/constants";
import { PropertyVideo, getCompositionDuration } from "./PropertyVideo";
import { TemplateA } from "./intros";
import {
  defaultVideoProps,
  type IntroProps,
  type PropertyVideoProps,
} from "./types";

const sampleIntroProps: IntroProps = {
  propertyName: "123 Maple Street",
  beds: 4,
  baths: 3,
  sqftLabel: "2,450",
  priceLabel: "$1,250,000",
  photos: [
    staticFile("placeholder-photo.jpg"),
    staticFile("placeholder-photo.jpg"),
    staticFile("placeholder-photo.jpg"),
    staticFile("placeholder-photo.jpg"),
  ],
  bedIcon: staticFile("icons/bed.png"),
  bathIcon: staticFile("icons/bath.png"),
  sqftIcon: staticFile("icons/sqft.png"),
};

const IntroTemplateA: React.FC = () => <TemplateA {...sampleIntroProps} />;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="IntroTemplateA"
        component={IntroTemplateA}
        durationInFrames={INTRO_DURATION_SEC * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="PropertyVideoLandscape"
        component={PropertyVideo}
        durationInFrames={getCompositionDuration(defaultVideoProps)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{
          ...defaultVideoProps,
          introTemplate: "A",
          bedIcon: staticFile("icons/bed.png"),
          bathIcon: staticFile("icons/bath.png"),
          sqftIcon: staticFile("icons/sqft.png"),
          photos: [
            {
              src: staticFile("placeholder-photo.jpg"),
              roomType: "Living Room",
              zoomDirection: "in",
            },
            {
              src: staticFile("placeholder-photo.jpg"),
              roomType: "Kitchen",
              zoomDirection: "out",
            },
          ],
        }}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: getCompositionDuration(props as PropertyVideoProps),
        })}
      />
      <Composition
        id="PropertyVideoVertical"
        component={PropertyVideo}
        durationInFrames={getCompositionDuration(defaultVideoProps)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultVideoProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: getCompositionDuration(props as PropertyVideoProps),
        })}
      />
    </>
  );
};
