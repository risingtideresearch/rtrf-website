import React, { useMemo } from "react";
import * as THREE from "three";
import { Units } from "./util";
import TubeLine, { AxisLine } from "./TubeLine";
import { Plane } from "three";

interface ScalingLines3DProps {
  boundingBox: THREE.Box3;
  offset?: number;
  textScale?: number;
  unit?: Units;
  // scales the decorations, otherwise sized in absolute metres for the vessel
  annotationScale?: number;
  // rings marking the clipping planes, only meaningful beside their controls
  clipMarkers?: boolean;
  clippingValues: { axis: "x" | "y" | "z"; value: [number, number] };
}

const ScalingLines3D: React.FC<ScalingLines3DProps> = ({
  boundingBox,
  offset = 0,
  textScale = 0.08,
  unit = Units.Feet,
  clippingValues = {},
  annotationScale = 1,
  clipMarkers = true,
}) => {
  const linesAndLabels = useMemo(() => {
    const k = annotationScale;
    const min = boundingBox.min;
    const max = boundingBox.max;
    const size = new THREE.Vector3();
    const u = unit == Units.Feet ? " ft" : " m";
    const multiplier = unit == Units.Feet ? 3.28084 : 1;

    boundingBox.getSize(size);

    const colors = {
      x: "#030303",
      y: "#030303",
      z: "#030303",
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
      context.font = "Bold 30px Helvetica, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(text, 256, 64);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      return texture;
    };

    const clippingLines: Array<AxisLine> = [];
    const clippingLabels: Array<any> = [];

    let clipAxis: "x" | "y" | "z" | null = null;
    let clipMinPos = 0;
    let clipMaxPos = 0;

    if (clippingValues) {
      clipAxis = clippingValues.axis;
      const [minPercent, maxPercent] = clippingValues.value;

      if (clipAxis === "x") {
        const range = max.x - min.x;
        clipMinPos = min.x + range * minPercent;
        clipMaxPos = min.x + range * maxPercent;
      } else if (clipAxis === "y") {
        const range = max.y - min.y;
        clipMinPos = min.y + range * minPercent;
        clipMaxPos = min.y + range * maxPercent;
      } else if (clipAxis === "z") {
        const range = max.z - min.z;
        clipMinPos = min.z + range * minPercent;
        clipMaxPos = min.z + range * maxPercent;
      }
    }

    if (clippingValues && clipAxis === "x") {
      const clippedLength = clipMaxPos - clipMinPos;

      clippingLines.push({
        points: [
          new THREE.Vector3(clipMinPos, min.y - offset, max.z + offset),
          new THREE.Vector3(clipMaxPos, min.y - offset, max.z + offset),
        ],
        color: "#030303",
        key: "clip-x-main",
      });

      // Circle markers at clip boundaries
      clippingLabels.push({
        position: new THREE.Vector3(
          clipMinPos + 0.0,
          min.y - offset,
          max.z + offset,
        ),
        color: "#030303",
        isCircle: true,
        rotation: [0, Math.PI / 2, 0],
        cylinderRotation: [0, 0, Math.PI / 2],
        key: "clip-x-circle-min",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          clipMaxPos - 0.0,
          min.y - offset,
          max.z + offset,
        ),
        color: "#030303",
        isCircle: true,
        rotation: [0, Math.PI / 2, 0],
        cylinderRotation: [0, 0, Math.PI / 2],
        key: "clip-x-circle-max",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          (clipMinPos + clipMaxPos) / 2,
          min.y - offset - 0.2 * k,
          max.z + offset,
        ),
        color: "#030303",
        texture: createTextTexture(
          `${(multiplier * clippedLength).toFixed(1)}${u}`,
          "#030303",
        ),
        key: "clip-x-label",
      });
    } else if (clippingValues && clipAxis === "y") {
      const clippedLength = clipMaxPos - clipMinPos;

      clippingLines.push({
        points: [
          new THREE.Vector3(max.x - offset, clipMinPos, min.z + offset),
          new THREE.Vector3(max.x - offset, clipMaxPos, min.z + offset),
        ],
        color: "#030303",
        key: "clip-y-main",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          max.x - offset,
          clipMinPos + 0.0,
          min.z + offset,
        ),
        color: "#030303",
        isCircle: true,
        rotation: [Math.PI / 2, 0, 0],
        cylinderRotation: [0, Math.PI / 2, 0],
        key: "clip-y-circle-min",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          max.x - offset,
          clipMaxPos - 0.0,
          min.z + offset,
        ),
        color: "#030303",
        isCircle: true,
        rotation: [Math.PI / 2, 0, 0],
        cylinderRotation: [0, Math.PI / 2, 0],
        key: "clip-y-circle-max",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          max.x - offset + 0.3 * k,
          (clipMinPos + clipMaxPos) / 2,
          min.z - 0.32 * k + offset,
        ),
        color: "#030303",
        texture: createTextTexture(
          `${(multiplier * clippedLength).toFixed(1)}${u}`,
          "#030303",
        ),
        key: "clip-y-label",
      });
    } else if (clippingValues && clipAxis === "z") {
      const clippedLength = clipMaxPos - clipMinPos;

      clippingLines.push({
        points: [
          new THREE.Vector3(max.x - offset, min.y - offset, clipMinPos),
          new THREE.Vector3(max.x - offset, min.y - offset, clipMaxPos),
        ],
        color: "#030303",
        key: "clip-z-main",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          max.x - offset,
          min.y - offset,
          clipMinPos + 0.0,
        ),
        color: "#030303",
        isCircle: true,
        rotation: [0, 0, Math.PI / 2],
        cylinderRotation: [Math.PI / 2, 0, 0],
        key: "clip-z-circle-min",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          max.x - offset,
          min.y - offset,
          clipMaxPos - 0.0,
        ),
        color: "#030303",
        isCircle: true,
        rotation: [0, 0, Math.PI / 2],
        cylinderRotation: [Math.PI / 2, 0, 0],
        key: "clip-z-circle-max",
      });

      clippingLabels.push({
        position: new THREE.Vector3(
          max.x - offset,
          min.y - offset - 0.2 * k,
          (clipMinPos + clipMaxPos) / 2,
        ),
        color: "#030303",
        texture: createTextTexture(
          `${(multiplier * clippedLength).toFixed(1)}${u}`,
          "#030303",
        ),
        key: "clip-z-label",
      });
    }

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
          new THREE.Vector3(min.x, min.y - offset + 0.1 * k, max.z + offset),
          new THREE.Vector3(min.x, min.y - offset - 0.1 * k, max.z + offset),
        ],
        color: colors.x,
        key: "x-tick-start",
      },
      {
        points: [
          new THREE.Vector3(max.x, min.y - offset + 0.1 * k, max.z + offset),
          new THREE.Vector3(max.x, min.y - offset - 0.1 * k, max.z + offset),
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
          new THREE.Vector3(max.x - offset + 0.1 * k, min.y, min.z + offset),
          new THREE.Vector3(max.x - offset - 0.1 * k, min.y, min.z + offset),
        ],
        color: colors.y,
        key: "y-tick-start",
      },
      {
        points: [
          new THREE.Vector3(max.x - offset + 0.1 * k, max.y, min.z + offset),
          new THREE.Vector3(max.x - offset - 0.1 * k, max.y, min.z + offset),
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
          new THREE.Vector3(max.x - offset + 0.1 * k, min.y - offset, min.z),
          new THREE.Vector3(max.x - offset - 0.1 * k, min.y - offset, min.z),
        ],
        color: colors.z,
        key: "z-tick-start",
      },
      {
        points: [
          new THREE.Vector3(max.x - offset + 0.1 * k, min.y - offset, max.z),
          new THREE.Vector3(max.x - offset - 0.1 * k, min.y - offset, max.z),
        ],
        color: colors.z,
        key: "z-tick-end",
      },
    ];

    const labels = [
      clippingValues.axis != "x" && {
        position: new THREE.Vector3(
          (min.x + max.x) / 2,
          min.y - offset - 0.2 * k,
          max.z + offset,
        ),
        color: colors.x,
        texture: createTextTexture(
          `${(multiplier * size.x).toFixed(1)}${u}`,
          colors.x,
        ),
        key: "x-label",
      },
      clippingValues.axis != "y" && {
        position: new THREE.Vector3(
          max.x - offset + 0.3 * k,
          (min.y + max.y) / 2,
          min.z - 0.32 * k + offset,
        ),
        color: colors.y,
        texture: createTextTexture(
          `${(multiplier * size.y).toFixed(1)}${u}`,
          colors.y,
        ),
        key: "y-label",
      },
      clippingValues.axis != "z" && {
        position: new THREE.Vector3(
          max.x - offset,
          min.y - offset - 0.2 * k,
          (min.z + max.z) / 2,
        ),
        color: colors.z,
        texture: createTextTexture(
          `${(multiplier * size.z).toFixed(1)}${u}`,
          colors.z,
        ),
        key: "z-label",
      },
    ].filter((d) => !!d);

    return { lines, labels, clippingLines, clippingLabels };
  }, [boundingBox, offset, unit, clippingValues, annotationScale]);

  const { lines, labels, clippingLines, clippingLabels } = linesAndLabels;

  const tubeRadius = 0.003 * annotationScale;

  return (
    <group>
      {lines.map((line) => (
        <TubeLine key={line.key} line={line} radius={tubeRadius} />
      ))}

      {clippingLines.map((line) => (
        <TubeLine key={line.key} line={line} radius={tubeRadius} />
      ))}

      {labels.map((label) => (
        <sprite
          key={label.key}
          userData={{ ignore: true }}
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

      {clippingLabels.map((label) => {
        if (label.isCircle) {
          if (!clipMarkers) return null;
          return (
            <group key={label.key}>
              <mesh
                userData={{ ignore: true }}
                position={[
                  label.position.x,
                  label.position.y,
                  label.position.z,
                ]}
                rotation={label.rotation}
              >
                <torusGeometry
                  args={[0.08 * annotationScale, 0.003 * annotationScale]}
                />
                <meshBasicMaterial color="#030303" />
              </mesh>
              <mesh
                userData={{ ignore: true }}
                position={[
                  label.position.x,
                  label.position.y,
                  label.position.z,
                ]}
                rotation={label.cylinderRotation}
              >
                <cylinderGeometry
                  args={[
                    0.08 * annotationScale,
                    0.08 * annotationScale,
                    0.003 * annotationScale,
                  ]}
                />
                <meshBasicMaterial toneMapped={false} color="#ffffff" />
              </mesh>
            </group>
          );
        }
        return (
          <sprite
            key={label.key}
            userData={{ ignore: true }}
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
        );
      })}
    </group>
  );
};

export default ScalingLines3D;
