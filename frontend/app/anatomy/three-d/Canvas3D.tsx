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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Vector3, Box3, Group, Object3D, Camera, Plane } from "three";
import * as THREE from "three";
import { Model3D } from "./Model3D";
import ScalingLines3D from "./ScalingLines3D";
import Annotations3D from "./Annotations3D";
import { ControlSettings } from "../ThreeDContainer";


export interface ClippingPlanes {
  [key: string]: Plane;
}

type Canvas3DProps = {
  clippingPlanes: { [key: string]: Plane };
  filteredLayers: Array<string>;
  settings: ControlSettings;
  scalingBoundingBox: Box3 | null;
  setScalingBoundingBox: (box: Box3 | null) => void;
  content: {
    annotations: Array<unknown>;
  };
  setActiveAnnotation: any;
  height: string | number;
};

const CAMERA_INITIAL_POSITION = [0, 0, 0] as const;
const CAMERA_FOV = 30;
const LIGHT_POSITIONS: Vector3[] = [new Vector3(-3, 6, 0)];
const FIT_DISTANCE_MULTIPLIER = 2.4;
const CAMERA_DIRECTION = new Vector3(0.5, 0.25, 0.625);

function RaycastHandler({ clippingPlanes, setHovered }) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const hoveredObject = useRef<THREE.Object3D | null>(null);
  const originalColor = useRef<THREE.Color | null>(null);

  const findParentLayer = (
    object: THREE.Object3D
  ): { name: string | null; url?: string; layer?: THREE.Object3D } => {
    let current = object;

    while (current) {
      if (current.userData?.url) {
        return {
          name: current.userData.layerName,
          url: current.userData?.url || current.userData?.originalUrl,
          layer: current,
        };
      }
      current = current.parent as THREE.Object3D;
    }

    return { name: object.name };
  };

  const resetHoveredObject = () => {
    if (hoveredObject.current && originalColor.current) {
      const material = (hoveredObject.current as THREE.Mesh)
        .material as THREE.MeshBasicMaterial;
      if (material && material.color) {
        material.color.copy(originalColor.current);
      }
      hoveredObject.current = null;
      originalColor.current = null;
      setHovered(null);
    }
  };

  const setHoverColor = (object: THREE.Object3D) => {
    const mesh = object as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;

    if (material && material.color) {
      if (hoveredObject.current && hoveredObject.current !== object) {
        resetHoveredObject();
      }

      if (hoveredObject.current !== object) {
        originalColor.current = material.color.clone();
        hoveredObject.current = object;
        material.color.set("#ffae34");
      }
    }
  };

  const isPointClipped = (point: THREE.Vector3): boolean => {
    if (!clippingPlanes) return false;

    for (const [_key, plane] of Object.entries(clippingPlanes)) {
      if (plane.distanceToPoint(point) < 0) {
        return true;
      }
    }
    return false;
  };

  const filterClippedIntersections = (
    intersects: THREE.Intersection[]
  ): THREE.Intersection[] => {
    if (!clippingPlanes) return intersects;

    return intersects.filter((intersect) => {
      const { point, object } = intersect;

      if (isPointClipped(point)) {
        return false;
      }

      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());

      if (isPointClipped(center)) {
        const corners = [
          new THREE.Vector3(box.min.x, box.min.y, box.min.z),
          new THREE.Vector3(box.min.x, box.min.y, box.max.z),
          new THREE.Vector3(box.min.x, box.max.y, box.min.z),
          new THREE.Vector3(box.min.x, box.max.y, box.max.z),
          new THREE.Vector3(box.max.x, box.min.y, box.min.z),
          new THREE.Vector3(box.max.x, box.min.y, box.max.z),
          new THREE.Vector3(box.max.x, box.max.y, box.min.z),
          new THREE.Vector3(box.max.x, box.max.y, box.max.z),
        ];

        const hasVisibleCorner = corners.some(
          (corner) => !isPointClipped(corner)
        );
        if (!hasVisibleCorner) {
          return false;
        }
      }

      return true;
    });
  };

  const isInsideCanvas = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseMove = (event: PointerEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      
      // Check if mouse is inside canvas bounds
      const isInside = 
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      
      isInsideCanvas.current = isInside;
      
      if (isInside) {
        mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      } else {
        resetHoveredObject();
      }
    };

    const onMouseLeave = () => {
      isInsideCanvas.current = false;
      resetHoveredObject();
    };

    canvas.addEventListener("pointermove", onMouseMove);
    canvas.addEventListener("pointerleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("pointermove", onMouseMove);
      canvas.removeEventListener("pointerleave", onMouseLeave);
      resetHoveredObject();
    };
  }, [gl]);

  useFrame(() => {
    if (typeof window === "undefined" || !scene || !camera || !isInsideCanvas.current) return;

    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    const visibleIntersects = filterClippedIntersections(intersects);

    if (visibleIntersects.length > 0) {
      const layerInfo = findParentLayer(visibleIntersects[0].object);
      setHovered(layerInfo);
      setHoverColor(visibleIntersects[0].object);
    } else {
      resetHoveredObject();
    }
  });

  return null;
}

export function Canvas3D({
  clippingPlanes,
  settings,
  scalingBoundingBox,
  setScalingBoundingBox,
  filteredLayers,
  content,
  setActiveAnnotation,
  height = '100vh'
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

  // Handle hover display with fade delay
  useEffect(() => {
    if (hovered) {
      // Immediately show new hover
      setDisplayHovered(hovered);
      // Clear any pending fade timeout
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    } else {
      // Delay hiding the display
      fadeTimeoutRef.current = setTimeout(() => {
        setDisplayHovered(null);
      }, 300); // 300ms delay before fading out
    }

    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [hovered]);

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
    center.y -= 1;
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
      console.warn(e)
    }
  }, [modelsLoaded.size, filteredLayers.length, centered]);

  const measureBounds = useCallback(() => {
    if (groupRef.current && setScalingBoundingBox) {
      tempBox.current.setFromObject(groupRef.current);
      setScalingBoundingBox(tempBox.current.clone());
    }
  }, [setScalingBoundingBox]);

  useEffect(() => {
    if (groupRef.current && modelsLoaded.size > 0) {
      requestAnimationFrame(() => {
        requestAnimationFrame(measureBounds);
      });
    }
  }, [filteredLayers, modelsLoaded.size, measureBounds, settings.expand]);

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
    []
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
          pointerEvents: 'none'
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
    [displayHovered]
  );

  const canvasRef = useRef(null);

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
            {scalingBoundingBox && (
              <>
                <ScalingLines3D
                  boundingBox={scalingBoundingBox}
                  unit={settings.units}
                />

                <Annotations3D
                  annotations={content.annotations}
                  setActiveAnnotation={setActiveAnnotation}
                />
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
