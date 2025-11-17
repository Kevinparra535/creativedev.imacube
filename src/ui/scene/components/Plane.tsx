import { usePlane } from "@react-three/cannon";

export interface PlaneProps {
  rotation?: [number, number, number];
  args?: [number, number];
  [key: string]: unknown;
}

export default function Plane({ rotation, args = [300, 300], ...rest }: PlaneProps) {
  const [ref] = usePlane(() => ({
    rotation,
    material: { restitution: 0.7, friction: 0.2 },
    ...rest,
  }));
  return (
    <mesh receiveShadow castShadow ref={ref}>
      <planeGeometry args={args} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
}
