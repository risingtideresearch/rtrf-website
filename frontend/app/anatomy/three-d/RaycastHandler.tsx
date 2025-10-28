import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { useEffect, useRef } from "react";

export default function RaycastHandler({ clippingPlanes, setHovered }) {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    if (
      typeof window === "undefined" ||
      !scene ||
      !camera ||
      !isInsideCanvas.current
    )
      return;

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
