"use client";

import { useMemo } from "react";
import { Plane, Vector3 } from "three";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

interface AxisSliderProps {
  label1: string;
  label2: string;
  min: number;
  max: number;
  axis: "x" | "y" | "z";
  handleChange: (dir: string, value: Plane) => void;
}

const SLIDER_GRID_STYLES = {
  display: "grid",
  textTransform: "uppercase" as const,
  fontSize: "0.75rem",
  gridTemplateColumns: "3rem 1fr 5rem",
  width: "25rem",
  gap: "1rem",
  marginBottom: "0.5rem",
};

export function AxisSlider({ label1, label2, min, max, axis, handleChange }: AxisSliderProps) {
  const axisVector = useMemo(() => {
    return {
      x: new Vector3(1, 0, 0),
      y: new Vector3(0, 1, 0),
      z: new Vector3(0, 0, 1),
    }[axis];
  }, [axis]);

  const handleSliderChange = (val: [number, number]) => {
    handleChange(`${axis}1`, new Plane(axisVector, -val[0]));
    handleChange(`${axis}2`, new Plane(axisVector.clone().negate(), val[1]));
  };

  return (
    <div style={SLIDER_GRID_STYLES}>
      <span style={{ textAlign: "right" }}>{label1}</span>
      <RangeSlider
        min={min}
        max={max}
        step={0.001}
        defaultValue={[min, max]}
        key={`${axis}-${min}-${max}`}
        onInput={handleSliderChange}
      />
      <span>{label2}</span>
    </div>
  );
}
