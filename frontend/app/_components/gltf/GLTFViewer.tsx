"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Vector3, Box3, Group, Plane } from "three";
import { GLTFModel } from "./GLTFModel";
import { models } from "./util";

export function GLTFViewer() {
  const [layers, setLayers] = useState(models);
  const groupRef = useRef<Group>(null);
  const cameraRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const [centered, setCentered] = useState(false);

  const [collapsed, setCollapsed] = useState(false);

  const [modelsLoaded, setModelsLoaded] = useState<Set<string>>(new Set([]));

  const [clippingPlane, setClippingPlane] = useState(
    new Plane(new Vector3(-1, 0, 0), 0),
  );

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
      const fitDistance = maxDim * 1.5;

      // Move camera back to fit all
      const direction = new Vector3(0, 0, 1); // forward vector
      const newPos = center.clone().add(direction.multiplyScalar(fitDistance));
      cameraRef.current.position.copy(newPos);
      cameraRef.current.lookAt(center);

      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      setCentered(true);
    }
  }, [modelsLoaded, layers.length]);

  useEffect(() => {
    if (groupRef.current) {
      const box = new Box3().setFromObject(groupRef.current);
      const scaling = box.getSize(new Vector3());
      console.log(scaling);
    }
  }, [groupRef]);

  return (
    <div>
      <div style={{ height: "90vh" }}>
        <Canvas
          camera={{ position: [0, 1.5, 3], fov: 50 }}
          // onCreated={({ camera }) => (cameraRef.current = camera)}
          onCreated={({ camera, gl }) => {
            cameraRef.current = camera;
            gl.localClippingEnabled = true;
          }}
        >
          <directionalLight position={[2, -4, 0]} intensity={1} />
          <directionalLight position={[-5, 10, 10]} intensity={1} />

          <directionalLight position={[-5, -10, -10]} intensity={1} />
          <directionalLight position={[1, 1, 0]} intensity={6} />
          <Suspense fallback={null}>
            <group ref={groupRef}>
              {layers.map((model) => (
                <GLTFModel
                  key={model}
                  url={model}
                  onLoad={() =>
                    setModelsLoaded((prev) => new Set(prev).add(model))
                  }
                  clippingPlane={clippingPlane}
                />
              ))}
            </group>
          </Suspense>
          <OrbitControls ref={controlsRef} dampingFactor={0.9} zoomSpeed={1} maxZoom={10} />
        </Canvas>
      </div>
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          width: "20rem",
          backdropFilter: "blur(10px)",
          padding: "1rem",
        }}
      >
        <input
          type="range"
          min={-5}
          max={15}
          step={0.01}
          value={-clippingPlane.constant}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            setClippingPlane(new Plane(new Vector3(-1, 0, 0), -value)); // Negative because normal is downward
          }}
          style={{ width: "100%" }}
        />
        <button type="button" onClick={() => setCollapsed((prev) => !prev)}>
          {"hide"}
        </button>
        {!collapsed &&
          models.map((model) => (
            <label
              key={model}
              style={{
                display: "block",
                margin: "1rem 0",
                fontSize: "0.75rem",
              }}
            >
              <input
                type={"checkbox"}
                onChange={(e) =>
                  e.target.checked
                    ? setLayers((prev) => [...prev, model])
                    : setLayers((prev) => prev.filter((d) => d != model))
                }
                checked={layers.includes(model)}
              />
              {model.replace("models/", "").replace(".gltf", "")}
            </label>
          ))}
      </div>
    </div>
  );
}
