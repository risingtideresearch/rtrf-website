"use client";
import React, { useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  Mesh,
  Vector3,
  Box3,
  Object3D,
  Plane,
  MathUtils,
  Material,
  Color,
} from "three";
import { Scene3DSettings } from "./Scene3D";

type Model3DProps = {
  url: string;
  onLoad?: () => void;
  clippingPlanes: Plane[];
  settings: Scene3DSettings;
};

export function Model3D({
  url,
  onLoad,
  clippingPlanes,
  settings,
}: Model3DProps) {
  const { scene } = useGLTF(url);
  const position = [0, 1, 0];
  const ref = useRef<Mesh>(null!);

  useEffect(() => {
    if (onLoad) onLoad();
    setTimeout(() => {
      // setFalling(true)
    }, 100);
  }, [scene]);

  const [targetY] = useState(position[1]); // Final resting Y
  const [falling, setFalling] = useState(false);

  // useEffect(() => {
  //   if (selected) {
  //     console.log("update");
  //   }
  //   setTimeout(() => {
  //     setFalling(true)
  //   }, 100)
  // }, [selected]);

  useEffect(() => {
    if (falling) {
      animate();
    }
  }, [falling]);

  function animate() {
    if (ref.current) {
      const box = new Box3().setFromObject(ref.current);
      const size = box.getSize(new Vector3());
      ref.current.position.set(
        position[0],
        // targetY + Math.random() * 30,
        targetY + size.y * Math.random() * 5,
        position[2],
      );
    }
  }

  useFrame((_, delta) => {
    if (!ref.current || !falling) return;

    const currentY = ref.current.position.y;
    const speed = 2;

    ref.current.position.y = MathUtils.lerp(currentY, targetY, delta * speed);

    if (Math.abs(ref.current.position.y - targetY) < 0.01) {
      ref.current.position.y = targetY;
      setFalling(false);
    }
  });

  scene.traverse((child) => {
    // Set name and userData on the top-level scene object
    const layerName = url.replace("models/", "").replace(".glb", "");
    scene.name = layerName;
    scene.userData = {
      ...scene.userData,
      url: url,
      layerName: layerName,
      isLayer: true,
      originalUrl: url,
    };

    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      materials.forEach((mat) => {
        mat.side = DoubleSide;
        mat.clippingPlanes = clippingPlanes;
        mat.clipShadows = true;
        mat.transparent = settings.transparent;
        mat.opacity = settings.transparent ? 0.5 : 1.0;

        if (url.indexOf("SUPERSTRUCTURE__ALUM.__PLATING") > -1) {
          (mat.color as Color).set(1, 1, 1);
        }
        if ("metalness" in mat && "roughness" in mat) {
          mat.metalness = 0.8;
          mat.roughness = 0.4;
        }
      });
 
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return (
    <>
      <primitive
        ref={ref}
        object={scene}
        dispose={null}
      />
    </>
  );
}
