"use client";

import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, ReactNode, useEffect } from "react";

interface ClippingPlanes {
  [key: string]: THREE.Plane;
}

interface CanvasRaycasterProps {
  children: ReactNode;
  clippingPlanes?: ClippingPlanes;
  setHovered: (obj: THREE.Object3D | null) => void;
}

export function CanvasRaycaster({
  children,
  clippingPlanes,
  setHovered,
}: CanvasRaycasterProps) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const hoveredObject = useRef<THREE.Object3D | null>(null);
  const originalColor = useRef<THREE.Color | null>(null);
  const isActive = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
      // Reset any hovered objects on unmount
      if (hoveredObject.current && originalColor.current) {
        const material = (hoveredObject.current as THREE.Mesh)
          .material as THREE.MeshBasicMaterial;
        if (material && material.color) {
          material.color.copy(originalColor.current);
        }
      }
      hoveredObject.current = null;
      originalColor.current = null;
    };
  }, []);

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

  const onMouseMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive.current || typeof window === 'undefined') return;
    
    const canvas = gl.domElement;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const onMouseLeave = () => {
    if (!isActive.current) return;
    resetHoveredObject();
  };

  const onPointerDown = () => {
    if (!isActive.current) return;
    if (hoveredObject.current) {
      const layerInfo = findParentLayer(hoveredObject.current);
      // onSelect?.(layerInfo.name, hoveredObject.current, layerInfo.url);
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

  useFrame(() => {
    if (!isActive.current || typeof window === 'undefined' || !scene || !camera) return;
    
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

  return (
    <group
      onPointerMove={onMouseMove}
      onPointerLeave={onMouseLeave}
      onPointerDown={onPointerDown}
    >
      {children}
    </group>
  );
}
