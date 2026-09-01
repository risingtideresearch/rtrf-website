/**
 * `?capture=1` on any /anatomy route pins the canvas to an exact pixel size and
 * exposes `window.__anatomyReady` and `window.__anatomyCapture()`, which
 * scripts/capture-stills.mjs drives to regenerate the homepage and story stills.
 *
 * Params: w, h (output pixels), dpr, zoom, cam ("x,y,z" camera direction),
 * clip ("0,0.5"), axis (x|y|z), search (layer substring), minimal (1),
 * transparent (0|1).
 */

export type CaptureParams = {
  width: number;
  height: number;
  dpr: number;
  zoom: number;
  cam: [number, number, number] | null;
  clip: [number, number] | null;
  axis: "x" | "y" | "z";
  search: string | null;
  minimal: boolean;
  transparent: boolean | null;
};

const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 840;
const DEFAULT_DPR = 2;

const positive = (value: string | null, fallback: number) => {
  const n = value === null ? NaN : Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

export function parseCaptureParams(search: string): CaptureParams | null {
  const params = new URLSearchParams(search);
  if (params.get("capture") !== "1") return null;

  let clip: [number, number] | null = null;
  const clipRaw = params.get("clip");
  if (clipRaw) {
    const [min, max] = clipRaw.split(",").map(Number);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      clip = [clamp01(min), clamp01(max)];
    }
  }

  let cam: [number, number, number] | null = null;
  const camRaw = params.get("cam");
  if (camRaw) {
    const parts = camRaw.split(",").map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) {
      cam = parts as [number, number, number];
    }
  }

  const axis = params.get("axis");
  const transparent = params.get("transparent");

  return {
    width: positive(params.get("w"), DEFAULT_WIDTH),
    height: positive(params.get("h"), DEFAULT_HEIGHT),
    dpr: positive(params.get("dpr"), DEFAULT_DPR),
    zoom: positive(params.get("zoom"), 1),
    cam,
    clip,
    axis: axis === "y" || axis === "z" ? axis : "x",
    search: params.get("search") || null,
    minimal: params.get("minimal") === "1",
    transparent: transparent === null ? null : transparent === "1",
  };
}
