"use client";

import { useCallback, useState } from "react";
import { Units } from "./three-d/util";
import { Plane, Vector3, Box3 } from "three";
import { Canvas3D } from "./three-d/Canvas3D";
import { ClippingPlaneControls } from "./three-d/ClippingPlaneControls";

export type ControlSettings = {
  transparent: boolean;
  expand: boolean;
  units: Units;
};

export interface ClippingPlanes {
  [key: string]: Plane;
}

const INITIAL_CLIPPING_PLANES: ClippingPlanes = {
  x1: new Plane(new Vector3(1, 0, 0), 13),
  x2: new Plane(new Vector3(-1, 0, 0), 2),
  y1: new Plane(new Vector3(0, 1, 0), 10),
  y2: new Plane(new Vector3(0, -1, 0), 10),
  z1: new Plane(new Vector3(0, 0, 1), 5),
  z2: new Plane(new Vector3(0, 0, -1), 5),
};

const INITIAL_SETTINGS: ControlSettings = {
  transparent: false,
  units: Units.Feet,
  expand: false,
};

export default function ThreeDContainer({
  content,
  setActiveAnnotation,
  filteredLayers,
}) {
  const [settings, setSettings] = useState<ControlSettings>(INITIAL_SETTINGS);
  const [clippingPlanes, setClippingPlanes] = useState<ClippingPlanes>(
    INITIAL_CLIPPING_PLANES
  );
  const [scalingBoundingBox, setScalingBoundingBox] = useState<Box3 | null>(
    null
  );

  const handleSetClippingPlane = useCallback((dir: string, value: Plane) => {
    setClippingPlanes((prev) => ({
      ...prev,
      [dir]: value,
    }));
  }, []);

  return (
    <>
      <Canvas3D
        clippingPlanes={clippingPlanes}
        filteredLayers={filteredLayers}
        settings={settings}
        scalingBoundingBox={scalingBoundingBox}
        setScalingBoundingBox={setScalingBoundingBox}
        content={content}
        setActiveAnnotation={setActiveAnnotation}
      />

      <ClippingPlaneControls
        settings={settings}
        setSettings={setSettings}
        setClippingPlane={handleSetClippingPlane}
      />
    </>
  );
}
