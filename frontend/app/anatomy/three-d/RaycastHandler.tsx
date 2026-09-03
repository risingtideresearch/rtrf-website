import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from 'three';
import { useEffect, useRef } from "react";

export default function RaycastHandler({ clippingPlanes, setHovered, onLock, filteredLayers, isMobile }) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const isInsideCanvas = useRef(false);

  // The mesh currently painted with hover highlight
  const paintedMesh = useRef<THREE.Object3D | null>(null);
  const savedColor = useRef<THREE.Color | null>(null);
  const savedMap = useRef<THREE.Texture | null>(null);
  const savedEmissive = useRef<THREE.Color | null>(null);
  const savedEmissiveIntensity = useRef<number>(0);
  const savedMetalness = useRef<number>(0);
  const savedRoughness = useRef<number>(0);

  // Locked (clicked) selection — persists until clicked again or empty space clicked
  const lockedMesh = useRef<THREE.Object3D | null>(null);
  const lockedLayerInfo = useRef<any>(null);

  // Click drag detection
  const clickStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  // Innermost named node at or above the pick — for a STEP export that is the
  // individual instance ("CELL 3") rather than the layer. GLTFLoader invents
  // names for unnamed meshes — "mesh_0", "mesh_0_6" (one per primitive), and
  // "_instance_10" when the base name is empty — which are only these tokens
  // and digits. It also replaces spaces in real names with underscores, which
  // findPartName puts back.
  const GENERATED_NAME = /^_?(mesh|instance)(_(mesh|instance|\d+))*$/i;
  const findPartName = (object: THREE.Object3D) => {
    let current = object;
    while (current && !current.userData?.url) {
      if (current.name && !GENERATED_NAME.test(current.name)) {
        return current.name.replace(/_/g, " ");
      }
      current = current.parent as THREE.Object3D;
    }
    return null;
  };

  const findParentLayer = (object: THREE.Object3D) => {
    let current = object;
    while (current) {
      if (current.userData?.url) {
        return {
          name: current.userData.layerName,
          url: current.userData?.url || current.userData?.originalUrl,
          layer: current,
          part: findPartName(object),
        };
      }
      current = current.parent as THREE.Object3D;
    }
    return { name: object.name };
  };

  const isLayerTransparent = (object: THREE.Object3D): boolean => {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return false;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    return mats.some(m => m.transparent === true);
  };

  const isPointClipped = (point: THREE.Vector3): boolean => {
    if (!clippingPlanes) return false;
    return clippingPlanes.some((p: THREE.Plane) => p.distanceToPoint(point) < 0);
  };

  // annotations share the scene but are not pickable — painting a label sprite
  // drops its texture and leaves a grey box under the cursor
  const isPickable = (object: THREE.Object3D) =>
    !object.userData?.ignore && !!findParentLayer(object).url;

  const filterClippedIntersections = (intersects: THREE.Intersection[]) => {
    const pickable = intersects.filter(({ object }) => isPickable(object));
    if (!clippingPlanes) return pickable;
    return pickable.filter(({ point, object }) => {
      if (isLayerTransparent(object)) return false;
      if (isPointClipped(point)) return false;
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
        return corners.some(c => !isPointClipped(c));
      }
      return true;
    });
  };

  const clearPaint = () => {
    if (!paintedMesh.current || !savedColor.current) return;
    const mat = (paintedMesh.current as THREE.Mesh).material as THREE.MeshStandardMaterial;
    if (mat?.color) {
      mat.color.copy(savedColor.current);
      mat.map = savedMap.current;
      if (savedEmissive.current && mat.emissive) mat.emissive.copy(savedEmissive.current);
      if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = savedEmissiveIntensity.current;
      if (mat.metalness !== undefined) mat.metalness = savedMetalness.current;
      if (mat.roughness !== undefined) mat.roughness = savedRoughness.current;
      mat.needsUpdate = true;
    }
    paintedMesh.current = null;
    savedColor.current = null;
    savedMap.current = null;
    savedEmissive.current = null;
  };

  const applyPaint = (object: THREE.Object3D) => {
    if (object.userData.ignore) return;
    const mat = (object as THREE.Mesh).material as THREE.MeshStandardMaterial;
    if (!mat?.color) return;

    if (paintedMesh.current && paintedMesh.current !== object) {
      clearPaint();
    }
    if (paintedMesh.current === object) return;

    savedColor.current = mat.color.clone();
    savedMap.current = mat.map;
    savedEmissive.current = mat.emissive?.clone() ?? null;
    savedEmissiveIntensity.current = mat.emissiveIntensity ?? 0;
    savedMetalness.current = mat.metalness ?? 0;
    savedRoughness.current = mat.roughness ?? 1;
    paintedMesh.current = object;

    mat.color.set(0x888888);
    mat.map = null;
    if (mat.emissive) {
      mat.emissive.set("#65a5b4");
      mat.emissiveIntensity = 0.4;
    }
    if (mat.metalness !== undefined) mat.metalness = 0.9;
    if (mat.roughness !== undefined) mat.roughness = 1.0;
    mat.needsUpdate = true;
  };

  useEffect(() => {
    lockedMesh.current = null;
    lockedLayerInfo.current = null;
    clearPaint();
    setHovered(null);
    onLock?.(null);
  }, [filteredLayers]);

  const raycastAt = (clientX: number, clientY: number) => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const pos = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.current.setFromCamera(pos, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    return filterClippedIntersections(intersects);
  };

  useEffect(() => {
    const canvas = gl.domElement;

    const onPointerMove = (event: PointerEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom;
      isInsideCanvas.current = inside;
      if (inside) {
        mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        if (!isMobile && clickStartPos.current) {
          const dx = event.clientX - clickStartPos.current.x;
          const dy = event.clientY - clickStartPos.current.y;
          if (Math.sqrt(dx * dx + dy * dy) >= 10) {
            isDragging.current = true;
            lockedMesh.current = null;
            lockedLayerInfo.current = null;
            onLock?.(null);
            clickStartPos.current = null;
          }
        }
      } else {
        if (lockedMesh.current) {
          applyPaint(lockedMesh.current);
          setHovered(lockedLayerInfo.current);
        } else {
          clearPaint();
          setHovered(null);
        }
      }
    };

    const onPointerLeave = () => {
      isInsideCanvas.current = false;
      if (lockedMesh.current) {
        applyPaint(lockedMesh.current);
        setHovered(lockedLayerInfo.current);
      } else {
        clearPaint();
        setHovered(null);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      clickStartPos.current = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      isDragging.current = false;
      if (!clickStartPos.current) return;
      const dx = event.clientX - clickStartPos.current.x;
      const dy = event.clientY - clickStartPos.current.y;
      clickStartPos.current = null;
      if (Math.sqrt(dx * dx + dy * dy) >= 10) return; // drag, not click

      const hits = raycastAt(event.clientX, event.clientY);
      if (hits.length > 0) {
        const layerInfo = findParentLayer(hits[0].object);
        const isSameLayer = layerInfo.url && layerInfo.url === lockedLayerInfo.current?.url;
        if (isSameLayer) {
          lockedMesh.current = null;
          lockedLayerInfo.current = null;
          onLock?.(null);
          clearPaint();
          setHovered(null);
        } else {
          lockedMesh.current = hits[0].object;
          lockedLayerInfo.current = layerInfo;
          onLock?.({ x: event.clientX, y: event.clientY });
          applyPaint(hits[0].object);
          setHovered(layerInfo);
        }
      } else {
        lockedMesh.current = null;
        lockedLayerInfo.current = null;
        onLock?.(null);
        clearPaint();
        setHovered(null);
      }
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      clearPaint();
    };
  }, [gl]);

  useFrame(() => {
    if (!scene || !camera || !isInsideCanvas.current) return;

    if (isDragging.current) {
      clearPaint();
      setHovered(null);
      return;
    }

    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    const hits = filterClippedIntersections(intersects);

    if (hits.length > 0) {
      const layerInfo = findParentLayer(hits[0].object);
      if (!isMobile && lockedLayerInfo.current && layerInfo.url !== lockedLayerInfo.current.url) {
        lockedMesh.current = null;
        lockedLayerInfo.current = null;
        onLock?.(null);
      }
      applyPaint(hits[0].object);
      setHovered(layerInfo);
    } else if (lockedMesh.current) {
      applyPaint(lockedMesh.current);
      setHovered(lockedLayerInfo.current);
    } else {
      clearPaint();
      setHovered(null);
    }
  });

  return null;
}
