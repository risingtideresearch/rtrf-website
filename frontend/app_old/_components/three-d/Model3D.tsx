"use client";
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import { DoubleSide, Mesh, Vector3, Box3, Plane, Color, Group } from "three";
import { CanvasAndControlsSettings } from "./CanvasAndControls";

type Model3DProps = {
  url: string;
  onLoad?: () => void;
  clippingPlanes: Plane[];
  settings: CanvasAndControlsSettings;
};

const ORIGINAL_POSITION = [0, 2, 0] as const;
const EXPLOSION_MULTIPLIER = 1.5;
const TRANSPARENT_OPACITY = 0.5;
const OPAQUE_OPACITY = 1.0;
const MATERIAL_CONFIG = {
  metalness: 0.9,
  roughness: 0.4,
} as const;

export function Model3D({
  url,
  onLoad,
  clippingPlanes,
  settings,
}: Model3DProps) {
  const { scene } = useGLTF(url);
  const ref = useRef<Group>(null);
  
  // Store original positions for each child to restore when expand is disabled
  const originalPositions = useRef<Map<string, Vector3>>(new Map());
  
  // Reusable objects for calculations
  const tempBox = useRef(new Box3());
  const tempSize = useRef(new Vector3());

  // Memoize layer name to avoid recalculation
  const layerName = useMemo(
    () => url.replace("models/", "").replace(".glb", ""),
    [url]
  );

  // Memoize material configuration function
  const configureMaterial = useCallback((mat: any) => {
    mat.side = DoubleSide;
    mat.clippingPlanes = clippingPlanes;
    mat.clipShadows = true;
    mat.transparent = settings.transparent;
    mat.opacity = settings.transparent ? TRANSPARENT_OPACITY : OPAQUE_OPACITY;

    // if (isSpecialPlating) {
    //   (mat.color as Color).set(1, 1, 1);
    // }
    
    if ("metalness" in mat && "roughness" in mat) {
      mat.metalness = MATERIAL_CONFIG.metalness;
      mat.roughness = MATERIAL_CONFIG.roughness;
    }
  }, [clippingPlanes, settings.transparent]);

  // Memoize mesh configuration function
  const configureMesh = useCallback((mesh: Mesh) => {
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];

    materials.forEach(configureMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }, [configureMaterial]);

  // Initialize positions and configure scene
  useEffect(() => {
    if (!ref.current) return;

    // Configure scene metadata
    scene.name = layerName;
    scene.userData = {
      ...scene.userData,
      url: url,
      layerName: layerName,
      isLayer: true,
      originalUrl: url,
    };

    // Store original positions and configure materials
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        configureMesh(child as Mesh);
      }
    });

    // Store original positions of direct children for expand functionality
    ref.current.children.forEach((child) => {
      const childId = child.uuid;
      if (!originalPositions.current.has(childId)) {
        originalPositions.current.set(childId, child.position.clone());
      }
    });

    onLoad?.();
  }, [scene, layerName, url, configureMesh, onLoad]);

  // Handle expand/collapse animation
  useEffect(() => {
    if (!ref.current) return;

    ref.current.children.forEach((child) => {
      const childId = child.uuid;
      const originalPos = originalPositions.current.get(childId);

      if (!originalPos) {
        // If we don't have the original position, store it now
        originalPositions.current.set(childId, child.position.clone());
        return;
      }

      if (settings.expand) {
        // Calculate explosion position
        tempBox.current.setFromObject(child);
        const size = tempBox.current.getSize(tempSize.current);
        const explosionDistance = size.y * EXPLOSION_MULTIPLIER;
        
        // Apply explosion offset while preserving original X and Z
        child.position.set(
          originalPos.x,
          originalPos.y + explosionDistance,
          originalPos.z
        );
      } else {
        // Return to original position
        child.position.copy(originalPos);
      }
    });
  }, [settings.expand]);

  // Update material properties when settings change
  useEffect(() => {
    if (!ref.current) return;

    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((mat) => {
          mat.transparent = settings.transparent;
          mat.opacity = settings.transparent ? TRANSPARENT_OPACITY : OPAQUE_OPACITY;
          mat.clippingPlanes = clippingPlanes;
        });
      }
    });
  }, [scene, settings.transparent, clippingPlanes]);

  return (
    <primitive
      ref={ref}
      object={scene}
      dispose={null}
      position={ORIGINAL_POSITION}
    />
  );
}
