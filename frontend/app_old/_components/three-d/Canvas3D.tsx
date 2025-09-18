"use client";
import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas } from "@react-three/fiber";
import { Vector3, Box3, Group, Object3D, Camera, Plane } from "three";
import { Model3D } from "./Model3D";
import ScalingLines3D from "./ScalingLines3D";
import { CanvasAndControlsSettings } from "./CanvasAndControls";
import { CanvasRaycaster } from "./CanvasRaycaster";

type Canvas3DProps = {
  clippingPlanes: { [key: string]: Plane };
  filteredLayers: Array<string>;
  settings: CanvasAndControlsSettings;
  scalingBoundingBox: Box3 | null;
  setScalingBoundingBox: (box: Box3 | null) => void;
};

const CAMERA_INITIAL_POSITION = [0, 2, 2.5] as const;
const CAMERA_FOV = 30;
const LIGHT_POSITIONS: Vector3[] = [
  new Vector3(-5, 1, 10),
  new Vector3(-5, -1, -10),
  new Vector3(-8, 10, 0),
  new Vector3(-3, 10, 0),
];
const FIT_DISTANCE_MULTIPLIER = 2.4;
const CAMERA_DIRECTION = new Vector3(0.5, 0.25, 0.625);

export function Canvas3D({
  clippingPlanes,
  settings,
  scalingBoundingBox,
  setScalingBoundingBox,
  filteredLayers,
}: Canvas3DProps) {
  const groupRef = useRef<Group>(null);
  const cameraRef = useRef<Camera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [centered, setCentered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<Object3D | null>(null);

  const tempBox = useRef(new Box3());
  const tempCenter = useRef(new Vector3());
  const tempSize = useRef(new Vector3());
  const tempDirection = useRef(new Vector3());
  const tempNewPos = useRef(new Vector3());

  const clippingPlanesValues = useMemo(
    () => Object.values(clippingPlanes),
    [clippingPlanes]
  );

  const handleModelLoad = useCallback((url: string) => {
    setModelsLoaded((prev) => {
      const newSet = new Set(prev);
      newSet.add(url);
      return newSet;
    });
  }, []);

  const centerCamera = useCallback(() => {
    if (!groupRef.current || !controlsRef.current || !cameraRef.current) {
      return;
    }

    tempBox.current.setFromObject(groupRef.current);
    const center = tempBox.current.getCenter(tempCenter.current);
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
    if (
      modelsLoaded.size === filteredLayers.length &&
      filteredLayers.length > 0 &&
      !centered
    ) {
      centerCamera();
    }
  }, [modelsLoaded.size, filteredLayers.length, centered, centerCamera]);

  const measureBounds = useCallback(() => {
    if (groupRef.current) {
      tempBox.current.setFromObject(groupRef.current);
      setScalingBoundingBox(tempBox.current.clone());
    }
  }, [setScalingBoundingBox]);

  useEffect(() => {
    if (groupRef.current && modelsLoaded.size > 0) {
      // Use double RAF for more reliable measurement after layout
      requestAnimationFrame(() => {
        requestAnimationFrame(measureBounds);
      });
    }
  }, [filteredLayers, modelsLoaded.size, measureBounds, settings.expand]);

  const handleCanvasCreated = useCallback(({ camera, gl }) => {
    cameraRef.current = camera;
    gl.localClippingEnabled = true;
  }, []);

  // Memoize light markers to avoid recreation
  const lightMarkers = useMemo(() =>
    LIGHT_POSITIONS.map((pos, index) => (
      <mesh key={`marker-${index}`} position={pos}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    )), []
  );

  const directionalLights = useMemo(
    () =>
      LIGHT_POSITIONS.map((pos, index) => (
        <directionalLight key={index} position={pos} intensity={0.8} />
      )),
    []
  );

  const hoverDisplay = useMemo(
    () => (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          backdropFilter: "blur(10px)",
          background: "rgb(229, 255, 0)",
          padding: "1rem",
          maxWidth: "50vw",
          zIndex: 10,
          opacity: hovered ? 1 : 0.3,
          transition: "opacity 0.2s ease-in-out",
        }}
      >
        {hovered?.name || "No object hovered"}
      </div>
    ),
    [hovered]
  );

  return (
    <div
      style={{
        height: "100vh",
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
          camera={{ position: CAMERA_INITIAL_POSITION, fov: CAMERA_FOV }}
          onCreated={handleCanvasCreated}
        >
          <CanvasRaycaster
            clippingPlanes={clippingPlanes}
            setHovered={setHovered}
          >
            <ambientLight intensity={5} />
            {directionalLights}
            {lightMarkers}

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
              {scalingBoundingBox && (
                <ScalingLines3D
                  boundingBox={scalingBoundingBox}
                  unit={settings.units}
                />
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

        {hoverDisplay}
      </div>
    </div>
  );
}
