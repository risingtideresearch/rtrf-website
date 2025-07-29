"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas } from "@react-three/fiber";
import { Vector3, Box3, Group, Plane, Object3D, Camera } from "three";
import { Model3D } from "./Model3D";
import { models as layers } from "./util";
import { ClippingPlaneControls } from "./ClippingPlaneControls";

export function Viewer3D() {
  const groupRef = useRef<Group>(null);
  const cameraRef = useRef<Camera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [centered, setCentered] = useState(false);

  const [collapsed, setCollapsed] = useState(true);
  const [hovered, setHovered] = useState<Object3D | null>(null);

  const [modelsLoaded, setModelsLoaded] = useState<Set<string>>(new Set([]));
  const [selectedSystems, setSelectedSystems] = useState<Array<string>>([]);

  const [clippingPlanes, setClippingPlanes] = useState({
    x1: new Plane(new Vector3(1, 0, 0), 13),
    x2: new Plane(new Vector3(-1, 0, 0), 2),
    y1: new Plane(new Vector3(0, 1, 0), 10),
    y2: new Plane(new Vector3(0, -1, 0), 10),
    z1: new Plane(new Vector3(0, 0, 1), 5),
    z2: new Plane(new Vector3(0, 0, -1), 5),
  });

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

      const scaling = box.getSize(new Vector3());
      console.log(box, scaling);

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

  const systems: { [key: string]: string[] } = {};

  layers.forEach((layer: string) => {
    layer
      .replace("models/", "")
      .replace(".", "")
      .split("__")
      .forEach((sys, i, all) => {
        if (i == 0 || i < all.length - 1) {
          if (!systems[sys]) {
            systems[sys] = [];
          }

          systems[sys].push(layer);
        }
      });
  });

  const lightPositions: Vector3[] = [
    new Vector3(-5, -1, 10),
    new Vector3(-5, -1, -10),
    new Vector3(5, 10, 0),
    new Vector3(-15, 10, 0),
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
    <div>
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
            camera={{ position: [0, 1.5, 3], fov: 50 }}
            onCreated={({ camera, gl }) => {
              cameraRef.current = camera;
              gl.localClippingEnabled = true;
            }}
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
                    if (selectedSystems.length == 0) {
                      return true;
                    }
                    for (let i = 0; i < selectedSystems.length; i += 1) {
                      if (
                        selectedSystems.includes(url) ||
                        systems[selectedSystems[i]]?.includes(url)
                      ) {
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
                      hovered={hovered}
                      setHovered={setHovered}
                      clippingPlanes={Object.values(clippingPlanes)}
                      selected={selectedSystems.includes(
                        findParentSystem(url) || "",
                      )}
                      handleSelect={() => {
                        console.log(url);
                        // setSelectedSystems((prev: string[]) => {
                        //   const parentKey = findParentSystem(url);
                        //   if (parentKey) {
                        //     if (prev.includes(parentKey)) {
                        //       return [];
                        //     }
                        //     return [parentKey];
                        //   }
                        //   return []
                        // })
                      }}
                    />
                  ))}
              </group>
            </Suspense>
            <OrbitControls
              ref={controlsRef}
              dampingFactor={0.9}
              zoomSpeed={1}
              maxZoom={10}
            />
          </Canvas>
        </div>
      </div>
      <ClippingPlaneControls
        setClippingPlane={(dir: string, value: Plane) => {
          setClippingPlanes((prev) => ({
            ...prev,
            [dir]: value,
          }));
        }}
        // clippingPlanes={clippingPlanes}
      />
      {hovered && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            backdropFilter: "blur(10px)",
            background: "rgb(229, 255, 0)",
            padding: "1rem",
            maxWidth: "50vw",
            // border: "1px solid",
          }}
        >
          {hovered.name}
        </div>
      )}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          width: "max-content",
          maxWidth: "20rem",
          backdropFilter: "blur(10px)",
          background: "rgba(255, 255, 255, 0.8)",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <button
          type="button"
          style={{ marginLeft: "auto", display: "block" }}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? "layers" : "hide"}
        </button>
        {!collapsed && (
          <div
            style={{
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            {Object.keys(systems).map((system) => {
              return (
                <div key={system}>
                  <label
                    style={{
                      fontSize: "0.875rem",
                      display: "flex",
                      flexDirection: "row",
                      gap: "0.5rem",
                      padding: "1rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <input
                      type={"checkbox"}
                      onChange={(e) =>
                        e.target.checked
                          ? setSelectedSystems((prev) => [...prev, system])
                          : setSelectedSystems((prev) =>
                              prev.filter((d) => d != system),
                            )
                      }
                      checked={selectedSystems.includes(system)}
                    />
                    <span>{system}</span>
                  </label>
                </div>
              );
            })}
            {/* {models.map((model) => (
              <label
                key={model}
                style={{
                  fontSize: "0.875rem",
                  display: "flex",
                  flexDirection: "row",
                  gap: "0.5rem",
                  padding: "1rem",
                  alignItems: "flex-start",
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
                <span>{model.replace("models/", "").replace(".", "")}</span>
              </label>
            ))} */}
          </div>
        )}
      </div>
    </div>
  );
}
