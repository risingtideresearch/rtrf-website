import React, { useMemo } from "react";
import * as THREE from "three";
import { Units } from "./util";
import TubeLine, { AxisLine } from "./TubeLine";

const Annotations3D: React.FC<unknown> = ({
  boundingBox,
  offset = 0,
  showLabels = true,
  textScale = 0.1,
  annotations,
}) => {
  const linesAndLabels = useMemo(() => {
    const min = boundingBox.min;
    const max = boundingBox.max;
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const colors = {
      y: "#000000",
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
    
    const lines = annotations.map((note) => ({
        points: [
        new THREE.Vector3(note.position.x, note.position.y, note.position.z),
        new THREE.Vector3(note.position.x, note.position.y + 1, note.position.z),
      ],
      color: colors.y,
      key: note._id + 'line',
    }));

    const labels = annotations.map((note) => ({
      position: new THREE.Vector3(
        note.position.x,
        note.position.y + 1 + 0.1,
        note.position.z
      ),
      color: colors.y,
      texture: createTextTexture(`1`, colors.y),
      key: note._id,
    }));

    console.log(labels)

    return { lines, labels };
  }, [annotations, boundingBox]);

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

export default Annotations3D;
