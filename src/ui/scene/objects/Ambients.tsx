import * as THREE from "three";

type Props = {
  groupPosition: [number, number, number];
  textureMap?: THREE.Texture;
};

const Ambients = ({ groupPosition, textureMap }: Props) => {
  return (
    <group position={groupPosition}>
      <mesh
        receiveShadow
        castShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[20, 20, 0.1]} />
        <meshStandardMaterial color="#fcfcfc" map={textureMap} />
      </mesh>
    </group>
  );
};

export default Ambients;
