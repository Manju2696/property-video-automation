export const INTRO_TEMPLATES: Record<string, string> = {
  A: "Split Panel White",
  B: "Hero Overlay",
  C: "Gradient Left",
  D: "Dark Card Split",
  E: "Elegant Light",
  F: "Bold Dark Split",
  G: "Center Minimal",
  H: "Photo Grid",
  I: "Gold Strip Tour",
  J: "Bottom Banner",
};

export const OUTRO_TEMPLATES: Record<string, string> = {
  "1": "Center Contact Strip",
  "2": "Bold Call Today",
  "3": "Gradient Left Panel",
  "4": "Serif Elegant",
  "5": "Gold Badge Chips",
  "6": "Gold Lines Frame",
  "7": "Big Today Type",
  "8": "Bottom Gradient Bar",
  "9": "Gold Slide Left",
  "10": "Initials Circle",
};

export const ROOM_TYPES = [
  "Front View",
  "Living Room",
  "Living Kitchen",
  "Kitchen",
  "Kitchen Dining",
  "Dining Room",
  "Primary Bedroom",
  "Bedroom",
  "Bathroom",
  "Office",
  "Laundry",
  "Hallway",
  "Backyard",
  "Pool",
  "Garage",
  "Aerial View",
  "Other",
] as const;

export const SEQUENCE_PRIORITY: Record<string, number> = {
  "Front View": 1,
  "Living Room": 2,
  "Living Kitchen": 3,
  Kitchen: 4,
  "Kitchen Dining": 5,
  "Dining Room": 6,
  "Primary Bedroom": 7,
  Bedroom: 8,
  Bathroom: 9,
  Office: 10,
  Laundry: 11,
  Hallway: 12,
  Pool: 13,
  Garage: 14,
  "Aerial View": 15,
  Backyard: 16,
  Other: 17,
};

export const ANIMATION_STYLES = [
  "fade_in",
  "slide_up",
  "scale_pop",
  "slide_left",
] as const;

export const FPS = 30;
export const INTRO_DURATION_SEC = 5;
export const OUTRO_DURATION_SEC = 5;
export const CROSSFADE_SEC = 0.75;
/** Fast zoom-in punch right after the intro ends */
export const INTRO_ZOOM_TRANSITION_SEC = 0.7;

export const AUTH_COOKIE = "pvp_session";
