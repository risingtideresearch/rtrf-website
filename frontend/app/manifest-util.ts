import drawingsManifest from "@/public/drawings/output_images/conversion_manifest.json";
import modelManifest from "@/public/models/export_manifest.json";
import jigManifest from "@/public/models-jig/export_manifest.json";
import batteryManifest from "@/public/models-battery/export_manifest.json";
import materialsManifest from "@/public/script-output/material_index_simple.json";
import homepageStills from "@/public/homepage/manifest.json";
import storyStills from "@/public/stories-stills.json";
import { ModelManifest } from "./anatomy/three-d/util";

export function getDrawingsManifest() {
  return drawingsManifest;
}

/** Anatomy crossfade tiles, in order. Written by scripts/capture-stills.mjs. */
export function getHomepageStills() {
  return homepageStills.tiles;
}

type StoryStill = { src: string; width: number; height: number };

/**
 * Versioned story stills. Falls back to the unversioned path so an article
 * added since the last capture run still renders.
 */
export function getStoryStill(
  slug: string,
  kind: "thumbs" | "preview",
): StoryStill {
  const entry = (storyStills.stories as Record<string, Record<string, StoryStill>>)[slug];
  return (
    entry?.[kind] ?? {
      src: `/${kind}/${slug}.png`,
      width: kind === "thumbs" ? 800 : 1600,
      height: kind === "thumbs" ? 420 : 840,
    }
  );
}

export function getModelManifest(): ModelManifest {
  return modelManifest as unknown as ModelManifest;
}

export function getMaterialsManifest() {
  return materialsManifest;
}

const jigFilenames = new Set(jigManifest.exported_layers.map((l) => l.filename));
const batteryFilenames = new Set(batteryManifest.exported_layers.map((l) => l.filename));

function modelsFolder(manifest: { export_info: unknown }, fallback: string): string {
  return (
    ((manifest.export_info as Record<string, unknown>).models_folder as string) ?? fallback
  );
}

/** Battery modules, converted from STEP by scripts/step-to-glb.py. */
export function getBatteryManifest(): ModelManifest {
  return batteryManifest as unknown as ModelManifest;
}

export function getModelURL(filename: string): string {
  // layer names carry spaces, "&" and "+", which `next start` will not serve
  // unencoded even though `next dev` does
  const encoded = encodeURIComponent(filename);
  if (jigFilenames.has(filename)) {
    return "/" + modelsFolder(jigManifest, "models-jig") + "/" + encoded;
  }
  if (batteryFilenames.has(filename)) {
    return "/" + modelsFolder(batteryManifest, "models-battery") + "/" + encoded;
  }
  return "/" + modelsFolder(modelManifest, "models") + "/" + encoded;
}
