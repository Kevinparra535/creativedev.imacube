import { MeshReflectorMaterial } from "@react-three/drei";
import React from "react";

const Mirror = () => {
  return (
    <mesh rotation={[0, 0, 0]}>
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
