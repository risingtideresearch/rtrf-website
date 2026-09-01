// Shot list for `npm run stills`. Params: see app/anatomy/capture.ts

/**
 * One render per story, written out twice: a small transparent tile for the
 * stories index hover card, and the full-size framed story preview used as the
 * Open Graph image.
 */
export const storyDefaults = {
  width: 1600,
  height: 840,
  dpr: 2,
  // the anatomy page's own default quarter
  cam: [0.5, 0.25, 0.625],
  zoom: 1.05,
  outputs: [
    { dir: "thumbs", scale: 0.5 },
    {
      dir: "preview",
      frame: {
        logo: "/RTRF_Logo-01_Stacked_BLK.svg",
        markSide: "right",
        // set to "/solander-38-wordmark.svg" to stack it above the logo again
        wordmark: null,
        showArticleTitle: false,
        grid: 20,
        marginCells: 2,
        logoNudgeY: 2,
        logoCells: 9,
        gapCells: 1,
        articleTitleCells: 16,
        articleTitleSize: 1.6,
        articleTitleLeading: 2,
        padding: 0.01,
        topSpace: 0.02,
        bottomSpace: 0.07,
        modelShiftX: -0.06,
        modelShiftY: -0.05,
      },
    },
  ],
};

export const homepageDefaults = {
  width: 900,
  height: 800,
  dpr: 2,
  cam: [0.5, 0.38, -0.7],
  zoom: 1.13,
  outputs: [
    { dir: "homepage", prefix: "solander-38-", shiftX: 0.04, shiftY: -0.06 },
  ],
};

// Order here is the crossfade order; it is written to public/homepage/manifest.json.
export const homepageShots = [
  { name: "overview", slug: "", minimal: true, alt: "overview" },
  { name: "superstructure", slug: "superstructure", alt: "superstructure" },
  { name: "body", slug: "body", alt: "body" },
  {
    name: "cross-section",
    slug: "body",
    clip: [0.12, 1],
    axis: "z",
    alt: "cross-section",
  },
  {
    name: "soles-and-bulkheads",
    slug: "",
    search: "soles",
    transparent: true,
    alt: "soles and bulkheads",
  },
  { name: "propulsion", slug: "propulsion", alt: "propulsion" },
  { name: "steering", slug: "electrical-steering", alt: "steering" },
];

// Stories are discovered from /stories; add an entry only to override one.
export const storyOverrides = {
  // "picking-a-hull": { transparent: false },
};
