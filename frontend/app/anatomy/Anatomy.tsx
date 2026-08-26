"use client";

import { useContext, useEffect, useLayoutEffect, useMemo, useState, useCallback } from "react";
import { Plane, Vector3 } from "three";
import { TOCContext } from "../toc/TableOfContents";
import {
  processModels,
  getSystemMap,
  computeCombinedBoundingBox,
  ModelManifest,
  MaterialIndex,
  contextualLayers,
  Units,
} from "./three-d/util";
import { Article, Component } from "@/sanity/sanity.types";
import { Canvas3D } from "./three-d/Canvas3D";
import { useGLTF } from "@react-three/drei";
import { getReducedModelSet, slugToRhinoSystem } from "../utils";
import { getModelURL } from "../manifest-util";
import AnatomyControls from "./AnatomyControls";
import Navigation, { URLS } from "../components/Navigation/Navigation";

type AnatomyContent = {
  material_index: MaterialIndex;
  models_manifest: ModelManifest;
  articles: Array<Article>;
  componentParts: Array<Component>;
  anatomyDescription?: string;
};

interface IAnatomy {
  content: AnatomyContent;
}

export type ControlSettings = {
  transparent?: boolean;
  // expand: boolean;
  units?: Units;
  scalingLines?: boolean;
  showClipping?: boolean;
  // monochrome?: boolean;
};

const isDefaultTransparentBody = (toc) => {
  return !(
    (toc.system.slug === "body" && !toc.article) ||
    toc.system.slug === "overview" ||
    toc.article?.slug === "picking-a-hull"
  );
};

export default function Anatomy({ content }: IAnatomy) {
  const toc = useContext(TOCContext);
  const { setModelLoaded } = toc;
  const [search, setSearch] = useState("");
  const memoModels = useMemo(() => processModels(content.models_manifest), []);
  const systems = useMemo(() => getSystemMap(memoModels), [memoModels]);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<ControlSettings>({
    transparent: isDefaultTransparentBody(toc),
    units: Units.Feet,
    scalingLines: true,
    showClipping: false,
  });

  useLayoutEffect(() => {
    setSettings((prev) => ({ ...prev, showClipping: window.innerWidth >= 900 }));
  }, []);
  const [clippingValues, setClippingValues] = useState<{
    value: [number, number];
    axis: "x" | "y" | "z";
  }>({
    value: [0, 1],
    axis: "x",
  });

  useEffect(() => {
    if (!settings.scalingLines || !settings.showClipping) {
      setClippingValues((prev) => ({ ...prev, value: [0, 1] }));
    }
  }, [settings.scalingLines, settings.showClipping]);

  const active =
    toc.system?.slug != "overview"
      ? {
          type: "system",
          key: slugToRhinoSystem(toc.system.slug),
        }
      : null;

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      transparent: isDefaultTransparentBody(toc),
    }));
  }, [toc.article, toc.system, toc]);

  const filteredLayers = useMemo(() => {
    let allModels = memoModels;
    let layerNames: string[] = allModels.map((m) => m.filename) || [];

    if (search) {
      layerNames = layerNames.filter((layer) => {
        return layer.toLowerCase().includes(search.toLowerCase());
      });
    } else if (
      !active &&
      clippingValues.value[0] == 0 &&
      clippingValues.value[1] == 1 &&
      !settings.transparent
    ) {
      // filter overview model when no clipping planes
      allModels = getReducedModelSet(memoModels, false);
      layerNames = allModels.map((m) => m.filename) || [];
    } else if (active) {
      if (toc.article) {
        layerNames =
          toc.article?.relatedModels ||
          systems[active.key]?.children ||
          layerNames;
      } else if (active.key != "overview") {
        layerNames = systems[active.key]?.children;
      }
    }

    // ensure CMS defined related models are in sync with current manifest
    layerNames = layerNames.filter((name) =>
      memoModels.find((layer) => layer.filename == name),
    );

    return Array.from(new Set(layerNames));
  }, [
    active,
    systems,
    search,
    clippingValues,
    settings.transparent,
    toc.article,
  ]);

  useEffect(() => {
    if (toc.article) {
      window.history.pushState(null, "", `/anatomy/${toc.article?.slug}`);
    } else if (toc.system.slug) {
      window.history.pushState(null, "", `/anatomy/${toc.system.slug}`);
    }
  }, [toc.article, toc.system.slug]);

  const visibleModelsBBoxes = memoModels
    .filter(
      (m) =>
        filteredLayers.includes(m.filename) &&
        (!contextualLayers.includes(m.filename) ||
          filteredLayers.includes(m.filename)),
    )
    .map((m) => m.bounding_box);

  const boundingBox = computeCombinedBoundingBox(visibleModelsBBoxes);

  // ensure contextual layers are rendered
  const layersToRender = useMemo(() => {
    return [
      ...filteredLayers.filter((layer) => !contextualLayers.includes(layer)),
      ...contextualLayers,
    ];
  }, [filteredLayers]);

  useEffect(() => {
    layersToRender.forEach((url) => useGLTF.preload(getModelURL(url)));
  }, [layersToRender]);

  const getClippingPlanes = useCallback(() => {
    if (!boundingBox) return [];

    const axisVector = {
      x: new Vector3(1, 0, 0),
      y: new Vector3(0, 1, 0),
      z: new Vector3(0, 0, 1),
    }[clippingValues.axis];

    // Get the min/max for the selected axis
    const axisIndex = { x: 0, y: 1, z: 2 }[clippingValues.axis];
    const min = boundingBox.min.getComponent(axisIndex);
    const max = boundingBox.max.getComponent(axisIndex);

    // Map 0-1 values to actual world coordinates
    const clipMin = min + clippingValues.value[0] * (max - min);
    const clipMax = min + clippingValues.value[1] * (max - min);

    // Create planes
    // Plane equation: normal · point + constant = 0
    // For clipping, we want to keep everything where normal · point + constant > 0
    return [
      new Plane(axisVector, -clipMin),
      new Plane(axisVector?.clone().negate(), clipMax),
    ];
  }, [clippingValues, boundingBox]);

  return (
    <div>
      {/* <input
        type="text"
        placeholder="search"
        value={search}
        style={{
          border: "1px solid var(--black)",
          position: "fixed",
          top: "3.25rem",
          left: "0.5rem",
          width: "15rem",
          zIndex: "1",
        }}
        onChange={(e) => {
          const val = e.target.value;
          setSearch(val);
        }}
      /> */}

      <Navigation
        active={URLS.ANATOMY}
        system={toc.system?.slug || null}
        story={toc.article?.slug || null}
      />

      <Canvas3D
        clippingPlanes={settings.showClipping ? getClippingPlanes() : []}
        clippingValues={clippingValues}
        filteredLayers={layersToRender}
        settings={settings}
        boundingBox={boundingBox}
        materials={content.material_index}
        componentParts={content.componentParts}
        memoModels={memoModels}
        handleLoaded={() => { setLoaded(true); setModelLoaded(true); }}
        loaded={loaded}
        slug={[toc.system?.slug, toc.article?.slug].filter(Boolean).join("-") || undefined}
      />

      <AnatomyControls
        settings={settings}
        setSettings={(val) => setSettings(val)}
        clippingValues={clippingValues}
        setClippingValues={setClippingValues}
        loaded={loaded}
        anatomyDescription={content.anatomyDescription}
        lastUpdated={content.models_manifest.export_info.timestamp_end}
      />
    </div>
  );
}
