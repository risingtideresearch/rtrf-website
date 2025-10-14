import React, { useMemo } from "react";
import * as THREE from "three";
import TubeLine from "./TubeLine";

const Annotations3D: React.FC<unknown> = ({
  showLabels = true,
  textScale = 0.1,
  annotations,
  setActiveAnnotation,
}) => {
  const linesAndLabels = useMemo(() => {

    const colors = {
      y: "#000000",
    };

    const createTextTexture = (text: string, color: string) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;

      // Higher resolution for crisp text
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = 512 * pixelRatio;
      canvas.height = 512 * pixelRatio; // Make it square

      context.scale(pixelRatio, pixelRatio);

      context.clearRect(0, 0, 512, 512);

      // Draw white circle background
      context.fillStyle = "#ffffff";
      context.strokeStyle = "black";
      context.lineWidth = 5;
      context.beginPath();
      context.arc(256, 256, 50, 0, Math.PI * 2); // circle at center with larger radius
      context.fill();
      context.stroke();

      // Draw text on top
      context.fillStyle = color;
      context.font = "Bold 60px Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";

      context.fillText(text, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      return texture;
    };

    const lines = annotations.map((note) => ({
      points: [
        new THREE.Vector3(note.position.x, note.position.y, note.position.z),
        new THREE.Vector3(note.position.x, 4.5, note.position.z),
      ],
      color: colors.y,
      key: note._id + "line",
    }));

    const labels = annotations.map((note) => ({
      position: new THREE.Vector3(
        note.position.x,
        4.5 + 0.5 * textScale,
        note.position.z
      ),
      color: colors.y,
      texture: createTextTexture(note.i, colors.y),
      key: note._id,
      note: note,
    }));

    return { lines, labels };
  }, [annotations]);

  const { lines, labels } = linesAndLabels;

  return (
    <group>
      {lines.map((line) => (
        <TubeLine key={line.key} line={line} />
      ))}

      {showLabels &&
        labels.map((label) => {
          const spriteSize = 0.8 * textScale; // Size of the circle
          return (
            <sprite
              key={label.key}
              position={[
                label.position.x,
                4.5 + spriteSize / 2,
                label.position.z,
              ]}
              scale={[spriteSize, spriteSize, 1]} // Square sprite for circular shape
              onClick={() => setActiveAnnotation(label.note)}
            >
              <spriteMaterial
                map={label.texture}
                transparent
                alphaTest={0.1}
                sizeAttenuation={false}
                toneMapped={false}
              />
            </sprite>
          );
        })}
    </group>
  );
};

export default Annotations3D;
