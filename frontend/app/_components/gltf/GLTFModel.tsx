"use client";
import React, { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { DoubleSide, Mesh, Vector3, Box3, Group, Object3D, Plane } from "three";

type GLTFModelProps = {
  url: string;
  onLoad?: () => void;
  clippingPlane?: Plane;
};
export function GLTFModel({ url, onLoad, clippingPlane }: GLTFModelProps) {
  const { scene } = useGLTF(url);
  const [hovered, setHovered] = useState<Object3D | null>(null);

  useEffect(() => {
    if (onLoad) onLoad();
  }, [scene]);

  function getTwoLevelsBelowTop(obj: Object3D): Object3D | null {
    let current = obj;
    const path: Object3D[] = [];

    while (current.parent) {
      path.push(current);
      current = current.parent;

      if (current.type === "Scene") break;
    }

    return path.length >= 3 ? path[path.length - 3] : null;
  }

  scene.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      materials.forEach((mat) => {
        mat.side = DoubleSide;
        if (clippingPlane) {
          mat.clippingPlanes = [clippingPlane];
          mat.clipShadows = true;
        }
      });

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Attach event handlers directly
      mesh.userData.eventHandlers = {
        onPointerEnter: (e: any) => {
          console.log("Mouse entered mesh:", mesh.name, url);
          setHovered(getTwoLevelsBelowTop(mesh));
        },
        onPointerLeave: (e: any) => {
          console.log("Mouse left mesh:", mesh.name, url);
          setHovered(null);
        },
      };
    }
  });

  const size = new Vector3();
  const center = new Vector3();

  if (hovered) {
    const box = new Box3().setFromObject(hovered);
    box.getSize(size);
    box.getCenter(center);
  }

  return (
    <>
      <primitive
        object={scene}
        dispose={null}
        onPointerEnter={(e: ThreeEvent<PointerEvent>) => {
          const handler = e.object.userData.eventHandlers?.onPointerEnter;
          handler?.(e);
        }}
        onPointerLeave={(e: ThreeEvent<PointerEvent>) => {
          const handler = e.object.userData.eventHandlers?.onPointerLeave;
          handler?.(e);
        }}
      />

      {center ? (
        <mesh position={center}>
          <boxGeometry args={[size.x, size.y, size.z]} />
          <meshBasicMaterial
            color="orangered"
            wireframe
            transparent
            opacity={1}
          />
        </mesh>
      ) : (
        <></>
      )}
    </>
  );
}
