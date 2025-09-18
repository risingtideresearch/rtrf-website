import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, ReactNode } from "react";

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

  // Find the parent layer by traversing up the object hierarchy
  const findParentLayer = (
    object: THREE.Object3D,
  ): { name: string | null; url?: string; layer?: THREE.Object3D } => {
    let current = object;

    // Traverse up the parent chain
    while (current) {
      // Check if current object has a name that indicates it's a layer
      if (
        current.name &&
        (current.name.includes("layer") ||
          current.name.includes("Layer") ||
          current.userData?.isLayer ||
          current.type === "Group") // Assuming layers are often Groups
      ) {
        return {
          name: current.name,
          url: current.userData?.url || current.userData?.originalUrl,
          layer: current,
        };
      }

      // Check userData for layer information
      if (current.userData?.layerName) {
        return {
          name: current.userData.layerName,
          url: current.userData?.url || current.userData?.originalUrl,
          layer: current,
        };
      }

      current = current.parent as THREE.Object3D;
    }

    return { name: object.name }; // No parent layer found
  };

  // Reset the previously hovered object's color
  const resetHoveredObject = () => {
    if (hoveredObject.current && originalColor.current) {
      const material = (hoveredObject.current as THREE.Mesh)
        .material as THREE.MeshBasicMaterial;
      if (material && material.color) {
        material.color.copy(originalColor.current);
      }
      hoveredObject.current = null;
      originalColor.current = null;

      // Notify parent about hover change
      setHovered(null);
    }
  };

  // Set hover color and store original
  const setHoverColor = (object: THREE.Object3D) => {
    const mesh = object as THREE.Mesh;
    const material = mesh.material as THREE.MeshBasicMaterial;

    if (material && material.color) {
      // Reset previous object if different
      if (hoveredObject.current && hoveredObject.current !== object) {
        resetHoveredObject();
      }

      // Set new hover state if not already set
      if (hoveredObject.current !== object) {
        originalColor.current = material.color.clone();
        hoveredObject.current = object;
        material.color.set("#ffae34");

        console.log("set color");
      }
    }
  };

  const onMouseMove = (event: React.PointerEvent<HTMLDivElement>) => {
    mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  // Reset color when mouse leaves the canvas
  const onMouseLeave = () => {
    resetHoveredObject();
  };

  // Handle click events
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (hoveredObject.current) {
      const layerInfo = findParentLayer(hoveredObject.current);
      // onSelect?.(layerInfo.name, hoveredObject.current, layerInfo.url);
      console.log(layerInfo)
    }
  };

  const isPointClipped = (point: THREE.Vector3): boolean => {
    if (!clippingPlanes) return false;

    // Check against all clipping planes
    for (const [key, plane] of Object.entries(clippingPlanes)) {
      if (plane.distanceToPoint(point) < 0) {
        return true; // Point is clipped
      }
    }
    return false; // Point is visible
  };

  const filterClippedIntersections = (
    intersects: THREE.Intersection[],
  ): THREE.Intersection[] => {
    if (!clippingPlanes) return intersects;

    return intersects.filter((intersect) => {
      const { point, object } = intersect;

      // Check if the intersection point is clipped
      if (isPointClipped(point)) {
        return false;
      }

      // Additional check: verify the object itself isn't completely clipped
      // by testing the object's bounding box against clipping planes
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());

      if (isPointClipped(center)) {
        // If center is clipped, check corners to see if any part is visible
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
          (corner) => !isPointClipped(corner),
        );
        if (!hasVisibleCorner) {
          return false; // Entire object is clipped
        }
      }

      return true; // Intersection is valid and visible
    });
  };

  useFrame(() => {
    // Update the raycaster with camera and mouse position
    raycaster.current.setFromCamera(mouse.current, camera);

    const intersects = raycaster.current.intersectObjects(scene.children, true);

    // Filter out clipped intersections
    const visibleIntersects = filterClippedIntersections(intersects);

    if (visibleIntersects.length > 0) {
      // if (!hoveredObject.current || hoveredObject.current != visibleIntersects[0].object) {
        // Find and notify about the parent layer
        const layerInfo = findParentLayer(visibleIntersects[0].object);
        setHovered(layerInfo);
      // }
      //  setHovered(visibleIntersects[0].object);
      setHoverColor(visibleIntersects[0].object);
    } else {
      // Reset color if no intersection
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
