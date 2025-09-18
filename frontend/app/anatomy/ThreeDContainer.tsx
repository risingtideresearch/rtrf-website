"use client";

import { useMemo } from "react";
import { CanvasAndControls } from "./three-d/CanvasAndControls";
import {
  getSystemMap,
  models,
  materialIndex,
} from "./three-d/util";

const containerStyle = {
  backgroundImage:
    "repeating-linear-gradient(0deg,#eee 0px,#eee 1px,transparent 1px,transparent 20px), repeating-linear-gradient( 90deg, #eee 0px, #eee 1px, transparent 1px, transparent 20px)",
  backgroundSize: "20px 20px",
};

export default function ThreeDContainer({ active, content }) {
  const systems = useMemo(() => getSystemMap(models), []);

  const filteredLayers = useMemo(() => {
    if (active) {
      if (active.type == "system") {
        return systems[active.key]?.children || [];
      } else if (active.type == "material") {
        return materialIndex.grouped_materials
          .find((mat) => mat.name == active.key)
          .associated_layers.sort()
          .map((child) => "models/" + child.layer_name + ".glb");
      }
    }
    return models;
  }, [active, systems]);

  return (
    <div style={containerStyle}>
      <CanvasAndControls filteredLayers={filteredLayers} content={content} />
    </div>
  );
}
