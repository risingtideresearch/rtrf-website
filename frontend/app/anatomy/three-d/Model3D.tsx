"use client";
import { useEffect, useRef, useMemo, useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import { getModelURL } from "@/app/manifest-util";
import { DoubleSide, Mesh, MeshStandardMaterial, Plane, Color, Group } from "three";

type Model3DProps = {
  url: string;
  onLoad?: () => void;
  clippingPlanes?: Plane[];
  transparent: boolean;
  // give each mesh its own material, so hover paints one instance at a time
  partHover?: boolean;
};

const ORIGINAL_POSITION = [0, 0, 0] as const;
const TRANSPARENT_OPACITY = 0.18;
const OPAQUE_OPACITY = 1.0;

export function Model3D({
  url,
  onLoad,
  clippingPlanes = [],
  transparent,
  partHover = false,
}: Model3DProps) {
  const { scene } = useGLTF(getModelURL(url), undefined, true);

  const ref = useRef<Group>(null);
  const isInitialized = useRef(false);

  const layerName = useMemo(() => url.replace(".glb", ""), [url]);

  const configureMaterial = useCallback(
    (mat: MeshStandardMaterial) => {
      mat.side = DoubleSide;
      if (!transparent) {
        mat.clippingPlanes = clippingPlanes;
      }

      if (mat.name == "Plastic") {
        (mat.color as Color).set(1, 0.3, 0);
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
    [clippingPlanes, transparent],
  );

  const configureMesh = useCallback(
    (mesh: Mesh) => {
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      materials.forEach((mat) => configureMaterial(mat as MeshStandardMaterial));
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
        const mesh = child as Mesh;
        if (partHover && !Array.isArray(mesh.material)) {
          mesh.material = mesh.material.clone();
        }
        configureMesh(mesh);
      }
    });

    onLoad?.();
  }, [scene, layerName, url, configureMesh, partHover]);

  useEffect(() => {
    if (!ref.current) return;

    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((mat) => {
          const m = mat as MeshStandardMaterial;
          if (!m.userData.originalColor) {
            m.userData.originalColor = m.color.clone();
          }

          m.transparent = transparent || false;
          m.depthWrite = !transparent;
          m.opacity = transparent
            ? TRANSPARENT_OPACITY
            : OPAQUE_OPACITY;
          m.clippingPlanes = transparent ? [] : clippingPlanes;

          if (transparent) {
            m.color.set(0xf0f8ff);
          } else {
            m.color.copy(m.userData.originalColor);
          }
        });
      }
    });
  }, [scene, transparent, clippingPlanes]);

  return (
    <primitive
      ref={ref}
      object={scene}
      dispose={null}
      position={ORIGINAL_POSITION}
    />
  );
}
