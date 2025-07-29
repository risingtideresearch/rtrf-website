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

type Model3DProps = {
  url: string;
  onLoad?: () => void;
  clippingPlanes: Plane[];
  hovered: Object3D | null;
  setHovered: (target: Object3D | null) => void;
  handleSelect: () => void;
  selected: boolean;
};
export function Model3D({
  url,
  onLoad,
  clippingPlanes,
  hovered,
  setHovered,
  handleSelect,
}: Model3DProps) {
  const { scene } = useGLTF(url);
  const position = [0, 1, 0];
  const ref = useRef<Mesh>(null!);

  useEffect(() => {
    if (onLoad) onLoad();
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

  // useEffect(() => {
  //   if (falling) {
  //     animate();
  //   }
  // }, [falling]);

  // function animate() {
  //   if (ref.current) {
  //     const box = new Box3().setFromObject(ref.current);
  //     const size = box.getSize(new Vector3());
  //     ref.current.position.set(
  //       position[0],
  //       // targetY + Math.random() * 30,
  //       targetY + (size.y * Math.random() * 5),
  //       position[2],
  //     );
  //   }
  // }

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
    scene.name = url.replace("models/", "").replace(".glb", "");
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      materials.forEach((mat) => {
        mat.side = DoubleSide;
        mat.clippingPlanes = clippingPlanes;
        mat.clipShadows = true;
        if ("metalness" in mat && "roughness" in mat) {
          mat.metalness = 0.8;
          mat.roughness = 0.3;
        }
      });

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (!mesh.userData.originalColors) {
        mesh.userData.originalColors = materials.map((mat: Material) => {
          if ("color" in mat) {
            return (mat.color as Color).clone();
          }
        });
      }

      mesh.userData.eventHandlers = {
        onPointerEnter: (e: PointerEvent) => {
          e.stopPropagation();
          console.log("Mouse entered mesh:", mesh.name, url);
          // setHovered(getTwoLevelsBelowTop(mesh));
          setHovered(scene);
          materials.forEach((mat) => {
            if ("color" in mat) {
              (mat.color as Color).set("#ffc2ff");
            }
          });
        },
        onPointerLeave: () => {
          console.log(
            "Mouse left mesh:",
            mesh.name,
            mesh.userData.originalColors,
          );
          setHovered(null);

          materials.forEach((mat, i) => {
            const original = mesh.userData.originalColors?.[i];
            if (original) {
              if ("color" in mat) {
                (mat.color as Color).copy(original);
              }
            }
          });
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

  function handleClick() {
    handleSelect();
  }

  function handleEvent(
    e: ThreeEvent<PointerEvent>,
    handler: (e: ThreeEvent<PointerEvent>) => void,
  ) {
    const isVisible = clippingPlanes.every((plane) => {
      return plane.distanceToPoint(e.point) >= 0;
    });

    if (!isVisible) return;
    handler?.(e);
  }

  return (
    <>
      <primitive
        ref={ref}
        object={scene}
        dispose={null}
        onPointerEnter={(e: ThreeEvent<PointerEvent>) => {
          const handler = e.object.userData.eventHandlers?.onPointerEnter;
          handleEvent(e, handler);
        }}
        onPointerLeave={(e: ThreeEvent<PointerEvent>) => {
          const handler = e.object.userData.eventHandlers?.onPointerLeave;
          handleEvent(e, handler);
        }}
        onClick={(e: ThreeEvent<PointerEvent>) => {
          handleEvent(e, handleClick);
        }}
      />

      {/* {center ? (
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
      )} */}
    </>
  );
}
