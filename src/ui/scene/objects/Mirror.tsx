import React from "react";

const Mirror = () => {
  return (
    <mesh>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#888888" metalness={1} roughness={0} />
    </mesh>
  );
};

export default Mirror;
