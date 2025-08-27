"use client";
import React from "react";
import { Plane, Vector3 } from "three";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";
import { Scene3DSettings } from "./Scene3D";
import { Units } from "./util";

interface ClippingPlaneControlsProps {
  setClippingPlane: (dir: string, value: Plane) => void;
  settings: Scene3DSettings;
  setSettings: (settings: Scene3DSettings) => void;
}

export function ClippingPlaneControls({
  setClippingPlane,
  settings,
  setSettings,
}: ClippingPlaneControlsProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <label
        style={{
          display: "inline-flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          marginLeft: "1rem",
        }}
      >
        <input
          checked={settings.transparent}
          type="checkbox"
          onChange={() =>
            setSettings((prev) => ({
              ...prev,
              transparent: !prev.transparent,
            }))
          }
        />
        <span>transparent</span>
      </label>
      <label>
        <select
          value={settings.units}
          onChange={(e) =>
            setSettings((prev: Scene3DSettings) => ({
              ...prev,
              units: e.target.value,
            }))
          }
          style={{
            display: "inline-flex",
            gap: "0.5rem",
            marginBottom: "1rem",
            marginLeft: "1rem",
          }}
        >
          {Object.values(Units).map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3rem 1fr 5rem",
          width: "25rem",
          gap: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ textAlign: "right" }}>stern</span>
        <RangeSlider
          min={-13}
          max={2}
          step={0.01}
          defaultValue={[-13, 2]}
          onInput={(val: [number, number]) => {
            setClippingPlane("x1", new Plane(new Vector3(1, 0, 0), -val[0]));
            setClippingPlane("x2", new Plane(new Vector3(-1, 0, 0), val[1]));
          }}
        />
        <span>bow</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3rem 1fr 5rem",
          width: "25rem",
          gap: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ textAlign: "right" }}>keel</span>
        <RangeSlider
          min={-1}
          max={5}
          step={0.01}
          defaultValue={[-1, 5]}
          onInput={(val: [number, number]) => {
            setClippingPlane("y1", new Plane(new Vector3(0, 1, 0), -val[0]));
            setClippingPlane("y2", new Plane(new Vector3(0, -1, 0), val[1]));
          }}
        />
        <span>deck</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3rem 1fr 5rem",
          width: "25rem",
          gap: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ textAlign: "right" }}>port</span>
        <RangeSlider
          min={-5}
          max={5}
          step={0.01}
          defaultValue={[-5, 5]}
          onInput={(val: [number, number]) => {
            setClippingPlane("z1", new Plane(new Vector3(0, 0, 1), -val[0]));
            setClippingPlane("z2", new Plane(new Vector3(0, 0, -1), val[1]));
          }}
        />
        <span>starboard</span>
      </div>
    </div>
  );
}
