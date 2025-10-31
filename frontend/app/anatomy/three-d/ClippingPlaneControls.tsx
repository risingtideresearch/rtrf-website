"use client";
import React, { useState, useMemo } from "react";
import { Plane, Box3 } from "three";
import { Units } from "./util";
import { BiSliderAlt, BiX } from "react-icons/bi";
import { ControlSettings } from "../ThreeDContainer";
import { AxisSlider } from "@/app/components/AxisSlider";

interface ClippingPlaneControlsProps {
  setClippingPlane: (dir: string, value: Plane) => void;
  settings: ControlSettings;
  setSettings: (updater: (prev: ControlSettings) => ControlSettings) => void;
  boundingBox: Box3;
}

const LABEL_STYLES = {
  display: "inline-flex",
  gap: "0.5rem",
  marginBottom: "1rem",
  marginLeft: "1rem",
};

function CheckboxControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label style={LABEL_STYLES}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

export function ClippingPlaneControls({
  setClippingPlane,
  settings,
  setSettings,
  boundingBox,
}: ClippingPlaneControlsProps) {
  const [collapsed, setCollapsed] = useState(true);

  const bounds = useMemo(() => {
    if (!boundingBox) {
      return {
        x: { min: -13, max: 2 },
        y: { min: -1, max: 5 },
        z: { min: -5, max: 5 },
      };
    }

    const round = (num: number) => Math.round(num * 1000) / 1000;
    const { min, max } = boundingBox;
    
    return {
      x: { min: round(min.x), max: round(max.x) },
      y: { min: round(min.y), max: round(max.y) },
      z: { min: round(min.z), max: round(max.z) },
    };
  }, [boundingBox]);

  const toggleSetting = (key: keyof ControlSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (collapsed) {
    return (
      <div style={{ position: "fixed", top: "3rem", right: "0.5rem" }}>
        <button
          className="pane"
          type="button"
          style={{ marginLeft: "auto", display: "block", border: "1px solid" }}
          onClick={() => setCollapsed(false)}
        >
          <BiSliderAlt size={18} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: "3rem", right: "0.5rem" }}>
      <button
        className="pane"
        type="button"
        style={{ marginLeft: "auto", display: "block", border: "1px solid" }}
        onClick={() => setCollapsed(true)}
      >
        <BiSliderAlt size={18} />
      </button>

      <div
        className="pane"
        style={{
          position: "absolute",
          right: "2rem",
          marginRight: "-1px",
          width: "max-content",
          top: "0",
          display: "flex",
          flexDirection: "column",
          border: "1px solid",
          background: "#fff",
          padding: "0.5rem",
        }}
      >
        <button
          onClick={() => setCollapsed(true)}
          style={{
            position: "absolute",
            right: "0",
            top: "0",
            backdropFilter: "none",
          }}
        >
          <BiX size={18} />
        </button>

        <CheckboxControl
          label="expand"
          checked={settings.expand}
          onChange={() => toggleSetting("expand")}
        />

        <CheckboxControl
          label="transparent"
          checked={settings.transparent}
          onChange={() => toggleSetting("transparent")}
        />

        <CheckboxControl
          label="monochrome"
          checked={settings.monochrome}
          onChange={() => toggleSetting("monochrome")}
        />

        <label>
          <select
            value={settings.units}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, units: e.target.value as Units }))
            }
            style={LABEL_STYLES}
          >
            {Object.values(Units).map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        <AxisSlider
          label1="stern"
          label2="bow"
          min={bounds.x.min}
          max={bounds.x.max}
          axis="x"
          handleChange={setClippingPlane}
        />

        <AxisSlider
          label1="keel"
          label2="deck"
          min={bounds.y.min}
          max={bounds.y.max}
          axis="y"
          handleChange={setClippingPlane}
        />

        <AxisSlider
          label1="port"
          label2="starboard"
          min={bounds.z.min}
          max={bounds.z.max}
          axis="z"
          handleChange={setClippingPlane}
        />
      </div>
    </div>
  );
}
