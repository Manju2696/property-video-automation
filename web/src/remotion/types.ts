export type VideoPhoto = {
  src: string;
  roomType: string;
  zoomDirection: "in" | "out";
  confidence?: number;
};

export type PropertyVideoProps = {
  propertyName: string;
  beds: number;
  baths: number;
  sqftLabel: string;
  priceLabel: string;
  introTemplate: string;
  outroTemplate: string;
  photoDurationSec: number;
  zoomIntensity: number;
  photos: VideoPhoto[];
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentInitials: string;
  heading: string;
  bedIcon: string;
  bathIcon: string;
  sqftIcon: string;
  musicUrl: string | null;
  musicVolume: number;
  introKicker: string;
  outroHeading: string;
  outroBrand: string;
  showIntro: boolean;
  showOutro: boolean;
  showRoomLabels: boolean;
  showIntroAddress: boolean;
  showIntroKicker: boolean;
  showIntroBeds: boolean;
  showIntroBaths: boolean;
  showIntroSqft: boolean;
  showIntroPrice: boolean;
};

export type IntroProps = {
  propertyName: string;
  beds: number;
  baths: number;
  sqftLabel: string;
  priceLabel: string;
  photos: string[];
  bedIcon: string;
  bathIcon: string;
  sqftIcon: string;
  kicker?: string;
  showAddress?: boolean;
  showKicker?: boolean;
  showBeds?: boolean;
  showBaths?: boolean;
  showSqft?: boolean;
  showPrice?: boolean;
};

export type OutroProps = {
  propertyName: string;
  heading: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentInitials: string;
  backgroundSrc: string | null;
};

export const defaultVideoProps: PropertyVideoProps = {
  propertyName: "123 Maple Street",
  beds: 4,
  baths: 3,
  sqftLabel: "2,450",
  priceLabel: "$1,250,000",
  introTemplate: "A",
  outroTemplate: "1",
  photoDurationSec: 4,
  zoomIntensity: 1.2,
  photos: [],
  agentName: "Alex Morgan",
  agentPhone: "(555) 010-2000",
  agentEmail: "alex@realty.example",
  agentInitials: "AM",
  heading: "SCHEDULE A SHOWING TODAY",
  bedIcon: "/icons/bed.png",
  bathIcon: "/icons/bath.png",
  sqftIcon: "/icons/sqft.png",
  musicUrl: null,
  musicVolume: 0.5,
  introKicker: "PROPERTY DETAILS",
  outroHeading: "SCHEDULE A SHOWING TODAY",
  outroBrand: "Better Homes and Gardens Real Estate",
  showIntro: true,
  showOutro: true,
  showRoomLabels: true,
  showIntroAddress: true,
  showIntroKicker: true,
  showIntroBeds: true,
  showIntroBaths: true,
  showIntroSqft: true,
  showIntroPrice: true,
};
