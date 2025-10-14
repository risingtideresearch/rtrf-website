"use client";
import React, { useState, useCallback } from "react";
import { Vector3, Plane, Box3 } from "three";
import { ClippingPlaneControls } from "./ClippingPlaneControls";
import { Canvas3D } from "./Canvas3D";
import { Units } from "./util";

export type CanvasAndControlsSettings = {
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

const INITIAL_SETTINGS: CanvasAndControlsSettings = {
  transparent: false,
  units: Units.Feet,
  expand: false,
};

export function CanvasAndControls({ filteredLayers, content }) {
  const [settings, setSettings] =
    useState<CanvasAndControlsSettings>(INITIAL_SETTINGS);
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
    <div>
      <Canvas3D
        clippingPlanes={clippingPlanes}
        filteredLayers={filteredLayers}
        settings={settings}
        scalingBoundingBox={scalingBoundingBox}
        setScalingBoundingBox={setScalingBoundingBox}
        content={content}
      />

      <input
        type="text"
        placeholder="search"
        // value={search}
        style={{
          border: "1px solid",
          position: "fixed",
          top: "3.25rem",
          left: "0.5rem",
          width: "15rem",
        }}
        // onChange={(e) => {
        //   const val = e.target.value.trim();
        //   setSearch(val);

        //   if (val != "") {
        //     setFocusIndex(-1);
        //   }
        // }}
      />

      <ClippingPlaneControls
        settings={settings}
        setSettings={setSettings}
        setClippingPlane={handleSetClippingPlane}
      />
    </div>
  );
}
