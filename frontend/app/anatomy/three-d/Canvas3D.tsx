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
import { ModelBoundary } from "./ModelBoundary";
import { contextualLayers, MaterialIndex, Model } from "./util";
import HoverDisplay from "../HoverDisplay";
import { ControlSettings } from "../Anatomy";
import { GizmoViewcube } from "./GizmoViewcube";
import { Component } from "@/sanity/sanity.types";
import { CaptureParams } from "../capture";
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
  tooltips?: boolean;
  // "object" trades sky for a key/fill/bounce rig, for a single component
  lighting?: "vessel" | "object";
  zoom?: boolean;
  pan?: boolean;
  // name the picked instance inside a layer rather than the layer itself. Off
  // for the anatomy view, where two boat GLBs carry node names of their own
  partHover?: boolean;
  // set by ?capture=1 — pins the canvas size and exposes the window hooks
  capture?: CaptureParams | null;
  // frame the camera on this box rather than the visible layers, so every
  // still places and sizes the vessel identically
  frameBox?: Box3 | null;
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

/**
 * Smallest distance along `direction` at which every corner of `box` still
 * projects inside the frustum, so the subject fills the frame whatever its
 * proportions.
 */
function fitDistanceForBox(
  box: Box3,
  center: Vector3,
  direction: Vector3,
  fov: number,
  aspect: number,
) {
  const tanV = Math.tan(fov / 2);
  const tanH = tanV * aspect;

  const forward = direction.clone().negate();
  const right = new Vector3()
    .crossVectors(forward, new Vector3(0, 1, 0))
    .normalize();
  const up = new Vector3().crossVectors(right, forward).normalize();

  const corner = new Vector3();
  let distance = 0;

  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        corner.set(x, y, z).sub(center);
        const depth = corner.dot(forward);
        distance = Math.max(
          distance,
          Math.abs(corner.dot(right)) / tanH - depth,
          Math.abs(corner.dot(up)) / tanV - depth,
        );
      }
    }
  }

  return distance;
}

// ScalingLines3D destructures this, so an unclipped scene still has to pass one
const FULL_EXTENT = { axis: "x", value: [0, 1] } as ClippingValues;

const VESSEL_LENGTH_M = 12;

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
  tooltips = false,
  lighting = "vessel",
  zoom = false,
  pan = false,
  partHover = false,
  height = "100vh",
  materials = {},
  memoModels = [],
  handleLoaded,
  componentParts,
  loaded,
  slug,
  capture = null,
  frameBox = null,
}: Canvas3DProps) {
  const groupRef = useRef<Group>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [centered, setCentered] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<Model | null>(null);
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [lockedAt, setLockedAt] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [derivedBox, setDerivedBox] = useState<Box3 | null>(null);
  // the framing distance, which is as far out as a story model may be zoomed
  const [zoomOutLimit, setZoomOutLimit] = useState<number | null>(null);

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
  const CAMERA_DIRECTION = capture?.cam
    ? new Vector3(...capture.cam)
    : interaction == "none"
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

    if (frameBox) {
      tempBox.current.copy(frameBox);
    } else {
      tempBox.current.setFromObject(groupRef.current);
    }
    setDerivedBox(tempBox.current.clone());
    const center = tempBox.current.getCenter(tempCenter.current);
    const size = tempBox.current.getSize(tempSize.current);

    // the 0.5m nudge is tuned for the vessel; on a small model it would be most
    // of its height
    center.y -= Math.min(0.5, size.y * 0.25);

    const camera = cameraRef.current;
    const fov = camera.fov * (Math.PI / 180);
    const aspect = camera.aspect;

    tempDirection.current.copy(CAMERA_DIRECTION).normalize();

    let baseDistance: number;
    let fitMultiplier: number;

    if (capture) {
      // A bounding sphere leaves a different amount of slack per layer set, so
      // stills would need a different zoom each. Fit the box corners instead.
      baseDistance = fitDistanceForBox(
        tempBox.current,
        center,
        tempDirection.current,
        fov,
        aspect,
      );
      fitMultiplier = 1.02;
    } else {
      const boundingSphereRadius =
        Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) / 2;

      const effectiveFov =
        aspect < 1 ? 2 * Math.atan(Math.tan(fov / 2) * aspect) : fov;

      baseDistance = boundingSphereRadius / Math.sin(effectiveFov / 2);
      fitMultiplier = 0.95;
    }

    const fitDistance = (baseDistance * fitMultiplier) / (capture?.zoom ?? 1);
    setZoomOutLimit(fitDistance);

    const newPos = tempNewPos.current
      .copy(center)
      .add(tempDirection.current.multiplyScalar(fitDistance));

    cameraRef.current.position.copy(newPos);
    cameraRef.current.lookAt(center);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();

    setCentered(true);
  }, [interaction, capture, frameBox]);

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

  const scalingBox = boundingBox ?? derivedBox;

  const annotationScale = useMemo(() => {
    if (boundingBox || !derivedBox) return 1;
    const size = derivedBox.getSize(new Vector3());
    return Math.min(1, 1.5 * Math.max(size.x, size.y, size.z) / VESSEL_LENGTH_M);
  }, [boundingBox, derivedBox]);

  const labelScale = annotationScale < 1 ? 0.14 : 0.08;

  // a fraction of the framing distance, so how close you can get scales with
  // the model rather than being fixed at the vessel's 0.8m
  const minDistance =
    interaction == "all" || !zoomOutLimit ? 0.8 : zoomOutLimit * 0.5;

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

  // Capture mode — see capture.ts. Exposes the same renderer readback the
  // Cmd+S shortcut uses, plus a readiness flag for headless drivers.
  useEffect(() => {
    if (!capture) return;
    const w = window as any;
    w.__anatomyCapture = () => captureRef.current?.() ?? null;
    return () => {
      delete w.__anatomyCapture;
    };
  }, [capture]);

  const captureReady =
    !!capture &&
    centered &&
    filteredLayers.length > 0 &&
    modelsLoaded.size >= filteredLayers.length;

  useEffect(() => {
    if (!capture) return;
    const w = window as any;
    if (!captureReady) {
      w.__anatomyReady = false;
      return;
    }
    // let a few frames land so environment maps and materials settle
    let frames = 0;
    let raf = requestAnimationFrame(function tick() {
      if ((frames += 1) >= 10) {
        w.__anatomyReady = true;
        return;
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [capture, captureReady]);

  const captureSize = capture
    ? {
        width: Math.round(capture.width / capture.dpr),
        height: Math.round(capture.height / capture.dpr),
      }
    : null;

  return (
    <div
      style={
        captureSize
          ? {
              ...captureSize,
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 9999,
              overflow: "hidden",
              background: "transparent",
            }
          : { height: height }
      }
      className={styles.container}
      suppressHydrationWarning
    >
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
        ref={wrapperRef}
        style={{ height: captureSize ? "100%" : height }}
        className={styles["canvas-wrapper"]}
        data-mounted={centered || undefined}
        suppressHydrationWarning
      >
        <Canvas
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          dpr={capture ? capture.dpr : undefined}
          camera={{ position: CAMERA_INITIAL_POSITION, fov: CAMERA_FOV }}
          onCreated={handleCanvasCreated}
          onPointerEnter={() => setAutoRotate(false)}
          onPointerLeave={() => setAutoRotate(true)}
        >
          <Environment
            // background
            blur={0.02}
            environmentIntensity={lighting == "object" ? 0.35 : 1}
            backgroundRotation={[0, -Math.PI / 6, 0]}
            files="/hdri/kloofendal_48d_partly_cloudy_puresky_2k.hdr"
          />

          {(interaction == "all" || tooltips) && (
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
                setHoveredPart(layer?.part ?? null);
              }}
              onLock={setLockedAt}
            />
          )}

          {/* the sky HDRI is strongly top-lit, so vertical faces fall to black */}
          <ambientLight intensity={lighting == "object" ? 0.18 : 0.75} />
          {lighting == "object" && directionalLights}

          <Suspense fallback={null}>
            {scalingBox && settings.scalingLines && (
              <group userData={{ capture_exclude: true }}>
                <ScalingLines3D
                  boundingBox={scalingBox}
                  unit={settings.units}
                  annotationScale={annotationScale}
                  textScale={labelScale}
                  clipMarkers={!!clippingValues}
                  clippingValues={clippingValues ?? FULL_EXTENT}
                />
              </group>
            )}
          </Suspense>

          <group ref={groupRef}>
            {filteredLayers.map((url: string) => (
              <ModelBoundary
                key={url}
                url={url}
                onFailure={() => handleModelLoad(url)}
              >
                <Suspense fallback={null}>
                  <Model3D
                    url={url}
                    onLoad={() => handleModelLoad(url)}
                    partHover={partHover}
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
              </ModelBoundary>
            ))}
          </group>

          <OrbitControls
            ref={controlsRef}
            enableDamping={false}
            autoRotate={autoRotate && !hovered && interaction != "all"}
            autoRotateSpeed={interaction == "none" ? 0.4 : 0.2}
            maxDistance={
              interaction == "all" ? 50 : (zoomOutLimit ?? 50)
            }
            minDistance={minDistance}
            enableZoom={interaction == "all" || zoom}
            enablePan={interaction == "all" || pan}
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
        {(loaded || tooltips) && (
          <HoverDisplay
            layer={hovered}
            materials={materials}
            settings={settings}
            componentParts={componentParts ?? []}
            partName={(partHover && hoveredPart) || undefined}
            lockedAt={lockedAt}
            containerRef={interaction == "all" ? undefined : wrapperRef}
          />
        )}
      </div>
    </div>
  );
}
