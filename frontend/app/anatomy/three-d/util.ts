import { Box3, Vector3 } from "three";

export enum Units {
  Meters = "Meters",
  Feet = "Feet",
}

export const processModels = (
  models_manifest
): { filename: string; bounding_box: BoundingBox }[] => {
  return models_manifest.exported_layers
    .filter(
      (d) =>
        d.file_size > 0 &&
        d.file_size < 100000000 
    )
    .map((d) => ({
      filename: d.filename,
      bounding_box: d.bounding_box,
    }));
};

export type SystemsMap = { [key: string]: { children: string[]; i: number } };
export const getSystemMap = (
  layers: Array<{ filename: string }>
): SystemsMap => {
  const systemsMap: SystemsMap = {};

  layers.forEach((layer: { filename: string }) => {
    const systemParts = layer.filename
      .replaceAll(".", "")
      .replace("glb", "")
      .split("__");

    systemParts.forEach((sys, i) => {
      // if (i < 3) {
      if (!systemsMap[sys]) {
        systemsMap[sys] = {
          children: [],
          i: i,
        };
      }
      systemsMap[sys].children.push(layer.filename);
      // }
    });
  });

  return systemsMap;
};

const INCHES_TO_METERS = 0.0254;

type BoundingBox = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  center: { x: number; y: number; z: number };
  dimensions: { width: number; depth: number; height: number };
};

export function computeCombinedBoundingBox(
  boxes: BoundingBox[], 
): Box3 {
  if (boxes.length === 0) {
    throw new Error("Cannot compute bounding box from empty array");
  }

  const scale = INCHES_TO_METERS;

  // Rhino: X, Y, Z → Three.js: X, Z, Y (swap Y and Z)
  const combinedMin = {
    x: boxes[0].min.x * scale,
    y: boxes[0].min.z * scale,  // Rhino Z → Three.js Y
    z: boxes[0].min.y * scale,  // Rhino Y → Three.js Z
  };

  const combinedMax = {
    x: boxes[0].max.x * scale,
    y: boxes[0].max.z * scale,  // Rhino Z → Three.js Y
    z: boxes[0].max.y * scale,  // Rhino Y → Three.js Z
  };

  for (let i = 1; i < boxes.length; i++) {
    const box = boxes[i];
    
    combinedMin.x = Math.min(combinedMin.x, box.min.x * scale);
    combinedMin.y = Math.min(combinedMin.y, box.min.z * scale);  // Rhino Z → Three.js Y
    combinedMin.z = Math.min(combinedMin.z, box.min.y * scale);  // Rhino Y → Three.js Z
    
    combinedMax.x = Math.max(combinedMax.x, box.max.x * scale);
    combinedMax.y = Math.max(combinedMax.y, box.max.z * scale);  // Rhino Z → Three.js Y
    combinedMax.z = Math.max(combinedMax.z, box.max.y * scale);  // Rhino Y → Three.js Z
  }

  return new Box3(
    new Vector3(combinedMin.x, combinedMin.y, combinedMin.z),
    new Vector3(combinedMax.x, combinedMax.y, combinedMax.z)
  );
}
