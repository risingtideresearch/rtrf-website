
import * as THREE from "three";

export type AxisLine = {
  points: [THREE.Vector3, THREE.Vector3];
  key: string;
  color: string;
};

interface TubeLineArgs {
  line: AxisLine;
  radius?: number;
}

function TubeLine({ line, radius = 0.002 }: TubeLineArgs) {
  const { points } = line;

  const validPoints = points.filter((point) => {
    const isValid =
      point &&
      isFinite(point.x) &&
      isFinite(point.y) &&
      isFinite(point.z)

    if (!isValid) {
      console.warn(`Invalid point detected in line ${line.key}:`, point);
    }

    return isValid;
  });

  if (validPoints.length < 2) {
    console.warn(
      `Insufficient valid points for line ${line.key}, skipping render`,
    );
    return null;
  }

  const curve = new THREE.CatmullRomCurve3(validPoints);

  return (
    <mesh key={line.key}>
      <tubeGeometry
        args={[
          curve, // The curve to follow
          64, // Number of segments along the curve
          radius, // Radius of the tube
          8, // Number of radial segments
          false, // Whether the tube is closed
        ]}
      />
      <meshBasicMaterial color={line.color} />
    </mesh>
  );
}

export default TubeLine;
