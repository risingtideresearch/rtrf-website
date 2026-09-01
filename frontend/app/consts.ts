export const SITE_URL =
  process.env.NEXT_PUBLIC_PREVIEW_SITE === "true"
    ? "https://solander38-preview.netlify.app"
    : "https://solander38.com";

export const SYSTEM_ORDER = [
  "overview",
  "power architecture",
  "superstructure",
  "control",
  "propulsion",
  "body",
  "water & heating systems",
  "outfitting & interior",
];
