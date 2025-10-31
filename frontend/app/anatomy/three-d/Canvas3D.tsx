"use client";
import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Environment, OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas } from "@react-three/fiber";
import { Vector3, Box3, Group, Object3D, Camera, Plane } from "three";
import * as THREE from "three";
import { Model3D } from "./Model3D";
import ScalingLines3D from "./ScalingLines3D";
// import Annotations3D from "./Annotations3D";
import { ControlSettings } from "../ThreeDContainer";
import RaycastHandler from "./RaycastHandler";

export interface ClippingPlanes {
  [key: string]: Plane;
}

type Canvas3DProps = {
  clippingPlanes: { [key: string]: Plane };
  filteredLayers: Array<string>;
  settings: ControlSettings;
  boundingBox: Box3 | null;
  content: {
    annotations: Array<unknown>;
  };
  setActiveAnnotation: () => void;
  height?: string | number;
};

const CAMERA_INITIAL_POSITION = [0, 0, 0] as const;
const CAMERA_FOV = 30;
const LIGHT_POSITIONS: Vector3[] = [new Vector3(-3, -4, 0)];
const FIT_DISTANCE_MULTIPLIER = 2.6;
const CAMERA_DIRECTION = new Vector3(0.5, 0.25, 0.625);

export function Canvas3D({
  clippingPlanes,
  settings,
  boundingBox,
  filteredLayers,
  content,
  setActiveAnnotation,
  height = "100vh",
}: Canvas3DProps) {
  const groupRef = useRef<Group>(null);
  const cameraRef = useRef<Camera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [centered, setCentered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<Object3D | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [displayHovered, setDisplayHovered] = useState<Object3D | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tempBox = useRef(new Box3());
  const tempCenter = useRef(new Vector3());
  const tempSize = useRef(new Vector3());
  const tempDirection = useRef(new Vector3());
  const tempNewPos = useRef(new Vector3());

  useEffect(() => {
    if (hovered) {
      setDisplayHovered(hovered);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    } else {
      fadeTimeoutRef.current = setTimeout(() => {
        setDisplayHovered(null);
      }, 300);
    }

    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [hovered]);

  const clippingPlanesValues = useMemo(
    () => Object.values(clippingPlanes),
    [clippingPlanes],
  );

  const handleModelLoad = useCallback((url: string) => {
    setModelsLoaded((prev) => {
      const newSet = new Set(prev);
      newSet.add(url);
      return newSet;
    });

    return () => {
      if (groupRef.current) {
        groupRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });
      }

      groupRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (groupRef.current) {
        groupRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });
      }
    };
  }, []);

  const centerCamera = useCallback(() => {
    if (!groupRef.current || !controlsRef.current || !cameraRef.current) {
      return;
    }

    tempBox.current.setFromObject(groupRef.current);
    const center = tempBox.current.getCenter(tempCenter.current);
    center.y -= 0.5;
    const size = tempBox.current.getSize(tempSize.current);
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitDistance = maxDim * FIT_DISTANCE_MULTIPLIER;

    tempDirection.current.copy(CAMERA_DIRECTION);
    const newPos = tempNewPos.current
      .copy(center)
      .add(tempDirection.current.multiplyScalar(fitDistance));

    cameraRef.current.position.copy(newPos);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();

    setCentered(true);
  }, []);

  useEffect(() => {
    try {
      if (
        modelsLoaded.size === filteredLayers.length &&
        filteredLayers.length > 0 &&
        !centered
      ) {
        centerCamera();
      }
    } catch (e) {
      console.warn(e);
    }
  }, [modelsLoaded.size, filteredLayers.length, centered]);

  // const measureBounds = useCallback(() => {
  //   if (groupRef.current && setScalingBoundingBox) {
  //     tempBox.current.setFromObject(groupRef.current);
  //     setScalingBoundingBox(tempBox.current.clone());
  //   }
  // }, [setScalingBoundingBox]);

  // useEffect(() => {
  //   if (groupRef.current && modelsLoaded.size > 0) {
  //     requestAnimationFrame(() => {
  //       requestAnimationFrame(measureBounds);
  //     });
  //   }
  // }, [filteredLayers, modelsLoaded.size, measureBounds, settings.expand]);

  const handleCanvasCreated = useCallback(({ camera, gl }) => {
    cameraRef.current = camera;
    gl.localClippingEnabled = true;
  }, []);

  const directionalLights = useMemo(
    () =>
      LIGHT_POSITIONS.map((pos, index) => (
        <directionalLight
          key={index}
          position={pos}
          intensity={0.5}
          color={"orange"}
        />
      )),
    [],
  );

  const hoverDisplay = useMemo(
    () => (
      <div
        className="pane"
        style={{
          position: "fixed",
          bottom: "0.5rem",
          left: "0.5rem",
          padding: "0.5rem",
          maxWidth: "50vw",
          zIndex: 10,
          opacity: displayHovered && !displayHovered.hide ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
          border: "1px solid",
          pointerEvents: "none",
        }}
      >
        {displayHovered?.name.split("__").map((n, i, x) => (
          <span
            key={n}
            style={{ fontSize: i < x.length - 1 ? "0.75em" : "1em" }}
          >
            {n}
            <br />
          </span>
        ))}
      </div>
    ),
    [displayHovered],
  );

  const canvasRef = useRef(null);

  // const downloadImage = () => {
  //   if (canvasRef.current) {
  //     const canvas = canvasRef.current;
  //     const image = canvas.toDataURL("image/png");

  //     const link = document.createElement("a");
  //     link.href = image;
  //     link.download = "solander-38.png";
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   }
  // };

  return (
    <div style={{ height: height }}>
      <div
        style={{
          opacity: centered ? 1 : 0,
          transition: "opacity 500ms",
          height: height,
        }}
      >
        <Canvas
          ref={canvasRef}
          gl={{ preserveDrawingBuffer: true }}
          camera={{ position: CAMERA_INITIAL_POSITION, fov: CAMERA_FOV }}
          onCreated={handleCanvasCreated}
          onPointerEnter={() => setAutoRotate(false)}
          onPointerLeave={() => setAutoRotate(true)}
        >
          <Environment
            blur={100}
            backgroundRotation={[0, -Math.PI / 6, 0]}
            preset="sunset"
          />

          <RaycastHandler
            clippingPlanes={clippingPlanes}
            setHovered={setHovered}
          />

          <ambientLight intensity={0.4} />
          {directionalLights}

          <Suspense fallback={null}>
            <group ref={groupRef}>
              {filteredLayers.map((url: string) => (
                <Model3D
                  key={url}
                  url={url}
                  onLoad={() => handleModelLoad(url)}
                  clippingPlanes={clippingPlanesValues}
                  settings={settings}
                />
              ))}
            </group>
            {boundingBox && (
              <>
                <ScalingLines3D
                  boundingBox={boundingBox}
                  unit={settings.units}
                />

                {/* <Annotations3D
                  annotations={content.annotations}
                  setActiveAnnotation={setActiveAnnotation}
                /> */}
              </>
            )}
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enableDamping={false}
            autoRotate={autoRotate}
            autoRotateSpeed={0.3}
          />
        </Canvas>

        {hoverDisplay}
      </div>
    </div>
  );
}
