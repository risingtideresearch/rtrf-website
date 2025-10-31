"use client";
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import { DoubleSide, Mesh, Vector3, Box3, Plane, Color, Group } from "three";
import * as THREE from "three";
import { ControlSettings } from "../ThreeDContainer";

type Model3DProps = {
  url: string;
  onLoad?: () => void;
  clippingPlanes: Plane[];
  settings: ControlSettings;
};

const ORIGINAL_POSITION = [0, 0, 0] as const;
const EXPLOSION_MULTIPLIER = 1.5;
const TRANSPARENT_OPACITY = 0.5;
const OPAQUE_OPACITY = 1.0;

export function Model3D({
  url,
  onLoad,
  clippingPlanes,
  settings,
}: Model3DProps) {
  const { scene } = useGLTF("/models/" + url);
  const ref = useRef<Group>(null);
  const isInitialized = useRef(false);

  const originalPositions = useRef<Map<string, Vector3>>(new Map());

  const tempBox = useRef(new Box3());
  const tempSize = useRef(new Vector3());

  const layerName = useMemo(() => url.replace(".glb", ""), [url]);

  const configureMaterial = useCallback(
    (mat) => {
      mat.side = DoubleSide;
      mat.clippingPlanes = clippingPlanes;

      if (mat.name == "Plastic") {
        (mat.color as Color).set(1, 0.3, 0);
      }

      if (mat.color.r < 0.1 && mat.color.g < 0.1 && mat.color.b < 0.1) {
        (mat.color as Color).set(0.2, 0.2, 0.2);
      }

      if ("metalness" in mat && "roughness" in mat) {
        if (mat.name.includes("Alum")) {
          mat.metalness = 1.0;
          mat.roughness = 0.2;
        } else if (mat.name.includes("Wood") || mat.name.includes("Plastic")) {
          mat.metalness = 1.0;
          mat.roughness = 1.0;
        }
      }
    },
    [clippingPlanes],
  );

  const configureMesh = useCallback(
    (mesh: Mesh) => {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      materials.forEach(configureMaterial);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    },
    [configureMaterial],
  );

  useEffect(() => {
    if (!ref.current || isInitialized.current) return;

    isInitialized.current = true;
    scene.name = layerName;
    scene.userData = {
      ...scene.userData,
      url: url,
      layerName: layerName,
      isLayer: true,
      originalUrl: url,
    };

    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        configureMesh(child as Mesh);
      }
    });

    onLoad?.();
  }, [scene, layerName, url, configureMesh]);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.children.forEach((child) => {
      const childId = child.uuid;
      const originalPos = originalPositions.current.get(childId);

      if (!originalPos) {
        originalPositions.current.set(childId, child.position.clone());
        return;
      }

      if (settings.expand) {
        tempBox.current.setFromObject(child);
        const size = tempBox.current.getSize(tempSize.current);
        const explosionDistance = size.y * EXPLOSION_MULTIPLIER;

        child.position.set(
          originalPos.x,
          originalPos.y + explosionDistance,
          originalPos.z,
        );
      } else {
        child.position.copy(originalPos);
      }
    });
  }, [settings.expand]);

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
          mat.opacity = settings.transparent
            ? TRANSPARENT_OPACITY
            : OPAQUE_OPACITY;
          mat.clippingPlanes = clippingPlanes;
        });
      }
    });
  }, [scene, settings.transparent, clippingPlanes]);

  useEffect(() => {
    if (!ref.current) return;

    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;

        if (settings.monochrome) {
          if (!mesh.userData.originalMaterial) {
            mesh.userData.originalMaterial = mesh.material;
          }

          const whiteMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0.8,
            side: DoubleSide,
            clippingPlanes: clippingPlanes,
          });

          mesh.material = whiteMaterial;

          // if (!mesh.userData.edgesLine) {
          //   const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
          //   const lineMaterial = new THREE.LineBasicMaterial({
          //     color: 0x000000,
          //     linewidth: 3,
          //   });
          //   const edgesLine = new THREE.LineSegments(edges, lineMaterial);
          //   mesh.add(edgesLine);
          //   mesh.userData.edgesLine = edgesLine;
          // }
        } else {
          if (mesh.userData.originalMaterial) {
            mesh.material = mesh.userData.originalMaterial;
            mesh.userData.originalMaterial = null;
          }

          if (mesh.userData.edgesLine) {
            mesh.remove(mesh.userData.edgesLine);
            mesh.userData.edgesLine.geometry.dispose();
            mesh.userData.edgesLine.material.dispose();
            mesh.userData.edgesLine = null;
          }
        }
      }
    });

    return () => {
      if (settings.monochrome && ref.current) {
        scene.traverse((child) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            if (mesh.material !== mesh.userData.originalMaterial) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material?.dispose();
              }
            }

            if (mesh.userData.edgesLine) {
              mesh.remove(mesh.userData.edgesLine);
              mesh.userData.edgesLine.geometry.dispose();
              mesh.userData.edgesLine.material.dispose();
              mesh.userData.edgesLine = null;
            }
          }
        });
      }
    };
  }, [scene, settings.monochrome, clippingPlanes]);

  return (
    <primitive
      ref={ref}
      object={scene}
      dispose={null}
      position={ORIGINAL_POSITION}
    />
  );
}
