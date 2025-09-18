import React, { useMemo } from "react";
import * as THREE from "three";
import { Units } from "./util";
import TubeLine, { AxisLine } from "./TubeLine";

interface ScalingLines3DProps {
  boundingBox: THREE.Box3;
  offset?: number;
  showLabels?: boolean;
  textScale?: number;
  unit?: Units;
}

const ScalingLines3D: React.FC<ScalingLines3DProps> = ({
  boundingBox,
  offset = 0,
  showLabels = true,
  textScale = 0.08,
  unit = Units.Feet,
}) => {
  const linesAndLabels = useMemo(() => {
    const min = boundingBox.min;
    const max = boundingBox.max;
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const colors = {
      x: "#000000", 
      y: "#000000", 
      z: "#000000",
    };

    const createTextTexture = (text: string, color: string) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;

      // Higher resolution for crisp text
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = 512 * pixelRatio;
      canvas.height = 128 * pixelRatio;

      context.scale(pixelRatio, pixelRatio);

      context.clearRect(0, 0, 512, 128);

      context.fillStyle = color;
      context.font = "Bold 32px Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(text, 256, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      return texture;
    };

    const lines: Array<AxisLine> = [
      // X-axis dimension line
      {
        points: [
          new THREE.Vector3(min.x, min.y - offset, max.z + offset),
          new THREE.Vector3(max.x, min.y - offset, max.z + offset),
        ],
        color: colors.x,
        key: "x-main",
      },
      // X-axis tick marks
      {
        points: [
          new THREE.Vector3(min.x, min.y - offset + 0.1, max.z + offset),
          new THREE.Vector3(min.x, min.y - offset - 0.1, max.z + offset),
        ],
        color: colors.x,
        key: "x-tick-start",
      },
      {
        points: [
          new THREE.Vector3(max.x, min.y - offset + 0.1, max.z + offset),
          new THREE.Vector3(max.x, min.y - offset - 0.1, max.z + offset),
        ],
        color: colors.x,
        key: "x-tick-end",
      },

      // Y-axis dimension line
      {
        points: [
          new THREE.Vector3(max.x - offset, min.y, min.z + offset),
          new THREE.Vector3(max.x - offset, max.y, min.z + offset),
        ],
        color: colors.y,
        key: "y-main",
      },
      // Y-axis tick marks
      {
        points: [
          new THREE.Vector3(max.x - offset + 0.1, min.y, min.z + offset),
          new THREE.Vector3(max.x - offset - 0.1, min.y, min.z + offset),
        ],
        color: colors.y,
        key: "y-tick-start",
      },
      {
        points: [
          new THREE.Vector3(max.x - offset + 0.1, max.y, min.z + offset),
          new THREE.Vector3(max.x - offset - 0.1, max.y, min.z + offset),
        ],
        color: colors.y,
        key: "y-tick-end",
      },

      // Z-axis dimension line
      {
        points: [
          new THREE.Vector3(max.x - offset, min.y - offset, min.z),
          new THREE.Vector3(max.x - offset, min.y - offset, max.z),
        ],
        color: colors.z,
        key: "z-main",
      },
      // Z-axis tick marks
      {
        points: [
          new THREE.Vector3(max.x - offset + 0.1, min.y - offset, min.z),
          new THREE.Vector3(max.x - offset - 0.1, min.y - offset, min.z),
        ],
        color: colors.z,
        key: "z-tick-start",
      },
      {
        points: [
          new THREE.Vector3(max.x - offset + 0.1, min.y - offset, max.z),
          new THREE.Vector3(max.x - offset - 0.1, min.y - offset, max.z),
        ],
        color: colors.z,
        key: "z-tick-end",
      },
    ];

    const u = unit == Units.Feet ? " ft" : " m";
    const multiplier = unit == Units.Feet ? 3.28084 : 1;

    const labels = [
      {
        position: new THREE.Vector3(
          (min.x + max.x) / 2,
          min.y - offset - 0.2,
          max.z + offset,
        ),
        color: colors.x,
        texture: createTextTexture(
          `${(multiplier * size.x).toFixed(1)}${u}`,
          colors.x,
        ),
        key: "x-label",
      },
      {
        position: new THREE.Vector3(
          max.x - offset + 0.3,
          (min.y + max.y) / 2,
          min.z - 0.32 + offset,
        ),
        color: colors.y,
        texture: createTextTexture(
          `${(multiplier * size.y).toFixed(1)}${u}`,
          colors.y,
        ),
        key: "y-label",
      },
      {
        position: new THREE.Vector3(
          max.x - offset,
          min.y - offset - 0.2,
          (min.z + max.z) / 2,
        ),
        color: colors.z,
        texture: createTextTexture(
          `${(multiplier * size.z).toFixed(1)}${u}`,
          colors.z,
        ),
        key: "z-label",
      },
    ];

    return { lines, labels };
  }, [boundingBox, offset, unit]);

  const { lines, labels } = linesAndLabels;

  return (
    <group>
      {lines.map((line) => (
        <TubeLine key={line.key} line={line} />
      ))}

      {/* Labels with adjustable scaling */}
      {showLabels &&
        labels.map((label) => (
          <sprite
            key={label.key}
            position={[label.position.x, label.position.y, label.position.z]}
            scale={[1.5 * textScale, 0.375 * textScale, 1]}
          >
            <spriteMaterial
              map={label.texture}
              transparent
              alphaTest={0.1}
              sizeAttenuation={false} // Prevents distortion with distance
            />
          </sprite>
        ))}
    </group>
  );
};

export default ScalingLines3D;
