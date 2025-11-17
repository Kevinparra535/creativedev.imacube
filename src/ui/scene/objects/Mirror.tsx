import { MeshReflectorMaterial } from "@react-three/drei";

type Props = {
  rotation?: [number, number, number];
  position?: [number, number, number];
};

const Mirror = ({ rotation, position }: Props) => {
  return (
    <mesh rotation={rotation} position={position}>
      <planeGeometry args={[10, 10]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={0}
        mixStrength={0.5}
      />
    </mesh>
  );
};

export default Mirror;
