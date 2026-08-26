"use client";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Environment, GizmoHelper, OrbitControls } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas, useThree } from "@react-three/fiber";
import { Vector3, Box3, Group, PerspectiveCamera, Plane } from "three";
import * as THREE from "three";
import { Model3D } from "./Model3D";
import ScalingLines3D from "./ScalingLines3D";
import RaycastHandler from "./RaycastHandler";
import { contextualLayers, MaterialIndex, Model } from "./util";
import HoverDisplay from "../HoverDisplay";
import { ControlSettings } from "../Anatomy";
import { GizmoViewcube } from "./GizmoViewcube";
import { Component } from "@/sanity/sanity.types";
import styles from "./canvas3d.module.scss";

export type ClippingValues = { value: [number, number]; axis: "x" | "y" | "z" };

type Canvas3DProps = {
  clippingPlanes?: Array<Plane>;
  clippingValues?: ClippingValues;
  filteredLayers: Array<string>;
  settings?: ControlSettings;
  boundingBox?: Box3 | null;
  height?: string | number;
  materials?: MaterialIndex;
  memoModels?: Array<Model>;
  handleLoaded?: () => void;
  loaded?: boolean;
  componentParts?: Array<Component>;
  slug?: string;
  // use for article models
  interaction?: "all" | "limited" | "none";
};

function CanvasCaptureHelper({
  captureRef,
}: {
  captureRef: { current: ((() => string) | null) };
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    captureRef.current = () => {
      const hidden: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (obj.userData.capture_exclude && obj.visible) {
          obj.visible = false;
          hidden.push(obj);
        }
      });

      const origBackground = scene.background;
      const origClearColor = new THREE.Color();
      const origClearAlpha = gl.getClearAlpha();
      gl.getClearColor(origClearColor);

      scene.background = null;
      gl.setClearColor(0x000000, 0);
      gl.render(scene, camera);
      const dataURL = gl.domElement.toDataURL("image/png");

      scene.background = origBackground;
      gl.setClearColor(origClearColor, origClearAlpha);
      hidden.forEach((obj) => { obj.visible = true; });

      return dataURL;
    };

    return () => { captureRef.current = null; };
  }, [gl, scene, camera, captureRef]);

  return null;
}

const CAMERA_INITIAL_POSITION = [0, 0, 0] as const;
const CAMERA_FOV = 30;
const LIGHT_POSITIONS: { pos: Vector3; intensity: number }[] = [
  { pos: new Vector3(8, 6, 4), intensity: 0.5 },   // key
  { pos: new Vector3(-8, 4, -4), intensity: 0.4 },  // fill (dark side)
  { pos: new Vector3(0, -4, 6), intensity: 0.2 },   // bounce
];

export function Canvas3D({
  clippingPlanes,
  clippingValues,
  settings = {},
  boundingBox,
  filteredLayers,
  interaction = "all",
  height = "100vh",
  materials = {},
  memoModels = [],
  handleLoaded,
  componentParts,
  loaded,
  slug,
}: Canvas3DProps) {
  const groupRef = useRef<Group>(null);
  const cameraRef = useRef<PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [centered, setCentered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<Model | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [lockedAt, setLockedAt] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const tempBox = useRef(new Box3());
  const tempCenter = useRef(new Vector3());
  const tempSize = useRef(new Vector3());
  const tempDirection = useRef(new Vector3());
  const tempNewPos = useRef(new Vector3());
  const CAMERA_DIRECTION =
    interaction == "none"
      ? new Vector3(0.1, 0.1, 0.5)
      : new Vector3(0.5, 0.25, 0.625);

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
    // adjust visual center
    center.y -= 0.5;

    const size = tempBox.current.getSize(tempSize.current);

    const camera = cameraRef.current;
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;

    tempDirection.current.copy(CAMERA_DIRECTION).normalize();

    const boundingSphereRadius =
      Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) / 2;

    const effectiveFov =
      aspect < 1 ? 2 * Math.atan(Math.tan(fov / 2) * aspect) : fov;

    const baseDistance = boundingSphereRadius / Math.sin(effectiveFov / 2);

    const FIT_DISTANCE_MULTIPLIER = 0.95;
    const fitDistance = baseDistance * FIT_DISTANCE_MULTIPLIER;

    const newPos = tempNewPos.current
      .copy(center)
      .add(tempDirection.current.multiplyScalar(fitDistance));

    cameraRef.current.position.copy(newPos);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();

    setCentered(true);
  }, [interaction]);

  useEffect(() => {
    setLockedAt(null);
  }, [filteredLayers]);

  useEffect(() => {
    try {
      if (
        modelsLoaded.size >= filteredLayers.length &&
        filteredLayers.length > 0 &&
        !centered
      ) {
        centerCamera();

        if (handleLoaded) {
          handleLoaded();
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, [modelsLoaded.size, filteredLayers.length, centered]);

  const handleCanvasCreated = useCallback(({ camera, gl }) => {
    cameraRef.current = camera;
    gl.localClippingEnabled = true;
  }, []);

  const directionalLights = useMemo(
    () =>
      LIGHT_POSITIONS.map(({ pos, intensity }, index) => (
        <directionalLight
          key={index}
          position={pos}
          intensity={intensity}
          color={"#ffffff"}
        />
      )),
    [],
  );

  const captureRef = useRef<(() => string) | null>(null);

  useEffect(() => {
    if (interaction !== "all") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!captureRef.current) return;
        const dataURL = captureRef.current();
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `solander-${slug ?? "anatomy"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [interaction, slug]);

  return (
    <div style={{ height: height }} className={styles.container}>
      <div className={`${styles["scroll-edge"]} ${styles["scroll-edge--left"]}`} />
      <div className={`${styles["scroll-edge"]} ${styles["scroll-edge--right"]}`} />
      <div className={styles["loading-overlay"]} data-mounted={!centered || undefined}>
        <span className={styles["loading-label"]}>Loading</span>
        <div className={styles["progress-track"]}>
          <div
            className={styles["progress-fill"]}
            style={{
              width: `${filteredLayers.length > 0 ? (modelsLoaded.size / filteredLayers.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <div
        style={{ height: height }}
        className={styles["canvas-wrapper"]}
        data-mounted={centered || undefined}
      >
        <Canvas
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          camera={{ position: CAMERA_INITIAL_POSITION, fov: CAMERA_FOV }}
          onCreated={handleCanvasCreated}
          onPointerEnter={() => setAutoRotate(false)}
          onPointerLeave={() => setAutoRotate(true)}
        >
          <Environment
            // background
            blur={0.02}
            backgroundRotation={[0, -Math.PI / 6, 0]}
            files="/hdri/kloofendal_48d_partly_cloudy_puresky_2k.hdr"
          />

          {interaction == "all" && (
            <RaycastHandler
              clippingPlanes={clippingPlanes}
              filteredLayers={filteredLayers}
              isMobile={isMobile}
              setHovered={(layer) => {
                setHovered(
                  layer
                    ? memoModels.find(
                        (d) => layer.name == d.filename.replace(".glb", ""),
                      ) || null
                    : null,
                );
              }}
              onLock={setLockedAt}
            />
          )}

          <ambientLight intensity={0.75} />
          {/* {directionalLights} */}

          <Suspense fallback={null}>
            {boundingBox && clippingValues && settings.scalingLines && (
              <group userData={{ capture_exclude: true }}>
                <ScalingLines3D
                  boundingBox={boundingBox}
                  unit={settings.units}
                  clippingValues={clippingValues}
                />
              </group>
            )}
          </Suspense>

          <group ref={groupRef}>
            {filteredLayers.map((url: string) => (
              <Suspense key={url} fallback={null}>
                <Model3D
                  url={url}
                  onLoad={() => handleModelLoad(url)}
                  clippingPlanes={clippingPlanes}
                  transparent={
                    (settings.transparent &&
                      (contextualLayers.includes(url) ||
                        url ==
                          "BODY__CTR BEAM__ctr beam inside surfaces.glb")) ||
                    false
                  }
                />
              </Suspense>
            ))}
          </group>

          <OrbitControls
            ref={controlsRef}
            enableDamping={false}
            autoRotate={autoRotate && !hovered && interaction != "all"}
            autoRotateSpeed={interaction == "none" ? 0.4 : 0.2}
            maxDistance={50}
            minDistance={0.8}
            enableZoom={interaction == "all"}
            enablePan={interaction == "all"}
            zoomSpeed={0.7}
            makeDefault
          />
          {interaction == "all" && !isMobile && (
            <GizmoHelper
              alignment={isMobile ? "top-left" : "bottom-right"}
              margin={isMobile ? [68, 160] : [110, 90]}
            >
              <group scale={[1.2, 1.2, 1.2]}>
                <GizmoViewcube
                  faces={["Bow", "Stern", "Deck", "Keel", "Starboard", "Port"]}
                  color="rgb(255, 255, 255)"
                  hoverColor="#b6cad3"
                  textColor="#030303"
                  font="18px Arial"
                />
              </group>
            </GizmoHelper>
          )}
          <CanvasCaptureHelper captureRef={captureRef} />
        </Canvas>
        {loaded && (
          <HoverDisplay
            layer={hovered}
            materials={materials}
            settings={settings}
            componentParts={componentParts ?? []}
            lockedAt={lockedAt}
          />
        )}
      </div>
    </div>
  );
}
