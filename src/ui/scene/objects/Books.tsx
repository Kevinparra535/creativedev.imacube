import { useBox } from "@react-three/cannon";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import niceColors from "nice-color-palettes";

const MeshEdgesMaterial = shaderMaterial(
  {
    color: new THREE.Color("white"),
    size: new THREE.Vector3(1, 1, 1),
    thickness: 0.01,
    smoothness: 0.2,
  },
  /*glsl*/ `varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * viewMatrix * instanceMatrix * vec4(position, 1.0);
  }`,
  /*glsl*/ `varying vec3 vPosition;
  uniform vec3 size;
  uniform vec3 color;
  uniform float thickness;
  uniform float smoothness;
  void main() {
    vec3 d = abs(vPosition) - (size * 0.5);
    float a = smoothstep(thickness, thickness + smoothness, min(min(length(d.xy), length(d.yz)), length(d.xz)));
    gl_FragColor = vec4(color, 1.0 - a);
  }`
);

extend({ MeshEdgesMaterial });

const c = new THREE.Color();

interface BookProps {
  position: [number, number, number];
  rotation: [number, number, number];
  size?: [number, number, number];
  color: number;
  [key: string]: unknown;
}

export function Book({
  position,
  rotation,
  size = [1.5, 1, 0.15],
  color,
  ...props
}: BookProps) {
  const [ref] = useBox(() => ({
    mass: 1,
    material: { restitution: 0.9, friction: 0.1 },
    linearDamping: 0.3,
    angularDamping: 0.3,
    position,
    rotation,
    args: size,
    ...props,
  }));

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshLambertMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export function Books({ length = 50 }) {
  const [books] = useState(() => {
    const sandboxSize = 100;
    const halfSize = sandboxSize / 2;
    const minY = 0.5;
    const maxY = 15;
    const palette = niceColors[17];
    const items = [];

    for (let i = 0; i < length; i++) {
      items.push({
        id: i,
        position: [
          -halfSize + Math.random() * sandboxSize,
          minY + Math.random() * (maxY - minY),
          -halfSize + Math.random() * sandboxSize,
        ] as [number, number, number],
        rotation: [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ] as [number, number, number],
        color: c.set(palette[Math.floor(Math.random() * 5)]).getHex(),
      });
    }

    return items;
  });

  return (
    <>
      {books.map((book) => (
        <Book key={book.id} {...book} />
      ))}
    </>
  );
}
