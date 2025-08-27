"use client";
import React, { useState } from "react";
import { Vector3, Plane, Object3D } from "three";
import { ClippingPlaneControls } from "./ClippingPlaneControls";
import { Canvas3D } from "./Canvas3D";
import { models as layers, tempMapping, Units } from "./util";

export type Scene3DSettings = {
  transparent: boolean;
  units: Units;
};

export interface ClippingPlanes {
  [key: string]: Plane;
}

export function Scene3D() {
  const [selectedSystems, setSelectedSystems] = useState<Array<string>>([]);
  const [collapsed, setCollapsed] = useState(true);
  const [hovered, setHovered] = useState<Object3D | null>(null);
  const [settings, setSettings] = useState<Scene3DSettings>({
    transparent: false,
    units: Units.Meters,
  });
  const [clippingPlanes, setClippingPlanes] = useState<ClippingPlanes>({
    x1: new Plane(new Vector3(1, 0, 0), 13),
    x2: new Plane(new Vector3(-1, 0, 0), 2),
    y1: new Plane(new Vector3(0, 1, 0), 10),
    y2: new Plane(new Vector3(0, -1, 0), 10),
    z1: new Plane(new Vector3(0, 0, 1), 5),
    z2: new Plane(new Vector3(0, 0, -1), 5),
  });
  const [scalingBoundingBox, setScalingBoundingBox] = useState<Box3 | null>(
    null,
  );

  const systems: { [key: string]: string[] } = {};

  layers.forEach((layer: string) => {
    layer
      .replace("models/", "")
      .replace(".", "")
      .split("__")
      .forEach((sys, i, all) => {
        if ((i == 0 || i == 1) && i < all.length - 1) {
          if (!systems[sys]) {
            systems[sys] = [];
          }

          systems[sys].push(layer);
        }
      });
  });

  console.log(systems)

  const filtered = layers.filter(
    (d) =>
      d.indexOf("SYSTEM COMPONENTS SIZED & PLACED") < 0 &&
      d.indexOf("HULLS, INTERNALS, ETC.__internals") < 0,
  );

  console.log(layers, filtered);

  return (
    <div>
      <div
        style={{
          height: "100vh",
          background: "radial-gradient(#ffffff, #9acdff)",
        }}
      >
        <Canvas3D
          clippingPlanes={clippingPlanes}
          hovered={hovered}
          setHovered={setHovered}
          selectedSystems={selectedSystems}
          settings={settings}
          scalingBoundingBox={scalingBoundingBox}
          setScalingBoundingBox={setScalingBoundingBox}
          layers={filtered}
          systems={systems}
        />
      </div>
      <ClippingPlaneControls
        settings={settings}
        setSettings={setSettings}
        setClippingPlane={(dir: string, value: Plane) => {
          setClippingPlanes((prev) => ({
            ...prev,
            [dir]: value,
          }));
        }}
        // clippingPlanes={clippingPlanes}
      />
      {hovered && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            backdropFilter: "blur(10px)",
            background: "rgb(229, 255, 0)",
            padding: "1rem",
            maxWidth: "50vw",
            // border: "1px solid",
          }}
        >
          {tempMapping[hovered.name] || hovered.name}
        </div>
      )}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          width: "max-content",
          maxWidth: "20rem",
          backdropFilter: "blur(10px)",
          background: "rgba(255, 255, 255, 0.8)",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <button
          type="button"
          style={{ marginLeft: "auto", display: "block" }}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? "layers" : "hide"}
        </button>
        {!collapsed && (
          <div
            style={{
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={selectedSystems.length > 0}
                onChange={() => {
                  if (selectedSystems.length == 0) {
                    setSelectedSystems([...Object.keys(systems)]);
                  } else {
                    setSelectedSystems([]);
                  }
                }}
              />
            </label>
            {Object.keys(systems).map((system) => {
              return (
                <div key={system}>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      display: "flex",
                      flexDirection: "row",
                      gap: "0.5rem",
                      padding: "1rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <input
                      type={"checkbox"}
                      onChange={(e) =>
                        e.target.checked
                          ? setSelectedSystems((prev) => [...prev, system])
                          : setSelectedSystems((prev) =>
                              prev.filter((d) => d != system),
                            )
                      }
                      checked={selectedSystems.includes(system)}
                    />
                    <span>{system}</span>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
