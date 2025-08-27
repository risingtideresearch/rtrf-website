"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas } from "@react-three/fiber";
import { Vector3, Box3, Group, Object3D, Camera, Plane } from "three";
import { Model3D } from "./Model3D";
import { models as layers, tempMapping } from "./util";
import ScalingLines3D from "./ScalingLines3D";
import { Scene3DSettings } from "./Scene3D";
import { CanvasRaycaster } from "./CanvasRaycaster";

type Canvas3DProps = {
  hovered: Object3D | null;
  setHovered: (obj: Object3D | null) => void;
  clippingPlanes: { [key: string]: Plane };
  selectedSystems: Array<string>;
  settings: Scene3DSettings;
  layers: Array<any>;
  systems: { [key: string]: any };
};

export function Canvas3D({
  hovered,
  setHovered,
  clippingPlanes,
  selectedSystems,
  settings,
  scalingBoundingBox,
  setScalingBoundingBox,
  layers,
  systems,
}: Canvas3DProps) {
  const groupRef = useRef<Group>(null);
  const cameraRef = useRef<Camera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [centered, setCentered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState<Set<string>>(new Set([]));

  // When all models are loaded, center and zoom
  useEffect(() => {
    if (
      modelsLoaded.size == layers.length &&
      groupRef.current &&
      controlsRef.current &&
      cameraRef.current &&
      !centered
    ) {
      const box = new Box3().setFromObject(groupRef.current);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fitDistance = maxDim * 2.4;

      // const scaling = box.getSize(new Vector3());
      // console.log(box, scaling);

      // Move camera back to fit all
      const direction = new Vector3(0.5, 0.25, 0.625);
      const newPos = center.clone().add(direction.multiplyScalar(fitDistance));
      cameraRef.current.position.copy(newPos);
      cameraRef.current.lookAt(center);

      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      setCentered(true);
    }
  }, [modelsLoaded, layers.length, centered]);

  console.log(systems);

  useEffect(() => {
    if (groupRef.current) {
      const measureBounds = () => {
        if (groupRef.current) {
          const box = new Box3().setFromObject(groupRef.current);
          setScalingBoundingBox(box);
        }
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(measureBounds);
      });
    }
  }, [selectedSystems, modelsLoaded]);

  const lightPositions: Vector3[] = [
    new Vector3(-5, 1, 10),
    new Vector3(-5, -1, -10),
    new Vector3(-8, 10, 0),
    new Vector3(-3, 10, 0),
  ];

  function findParentSystem(targetValue: string): string | null {
    for (const [key, values] of Object.entries(systems)) {
      if (values.includes(targetValue)) {
        return key;
      }
    }

    return null;
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "radial-gradient(#ffffff, #9acdff)",
      }}
    >
      <div
        style={{
          opacity: centered ? 1 : 0,
          transition: "opacity 500ms",
          height: "100vh",
        }}
      >
        <Canvas
          camera={{ position: [0, 1.25, 2.5], fov: 30 }}
          onCreated={({ camera, gl }) => {
            cameraRef.current = camera;
            gl.localClippingEnabled = true;
          }}
        >
          <CanvasRaycaster
            clippingPlanes={clippingPlanes}
            setHovered={setHovered}
          >
            <ambientLight intensity={4} />

            {lightPositions.map((pos, index) => (
              <directionalLight key={index} position={pos} intensity={0.5} />
            ))}

            {/* Debug light position markers */}
            {lightPositions.map((pos, index) => (
              <mesh key={`marker-${index}`} position={pos}>
                <boxGeometry args={[0.3, 0.3, 0.3]} />
                <meshStandardMaterial color="hotpink" />
              </mesh>
            ))}
            <Suspense fallback={null}>
              <group ref={groupRef}>
                {layers
                  .filter((url: string) => {
                    if (
                      selectedSystems.length == 0 ||
                      selectedSystems.includes(url)
                    ) {
                      return true;
                    }
                    for (let i = 0; i < selectedSystems.length; i += 1) {
                      if (systems[selectedSystems[i]]?.includes(url)) {
                        return true;
                      }
                    }
                    return false;
                  })
                  .map((url: string) => (
                    <Model3D
                      key={url}
                      url={url}
                      onLoad={() =>
                        setModelsLoaded((prev) => new Set(prev).add(url))
                      }
                      clippingPlanes={Object.values(clippingPlanes)}
                      settings={settings}
                    />
                  ))}
              </group>
              {scalingBoundingBox ? (
                <ScalingLines3D
                  boundingBox={scalingBoundingBox}
                  unit={settings.units}
                />
              ) : (
                <></>
              )}
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              dampingFactor={0.9}
              zoomSpeed={1}
              maxZoom={10}
            />
          </CanvasRaycaster>
        </Canvas>
      </div>
    </div>
  );
}
