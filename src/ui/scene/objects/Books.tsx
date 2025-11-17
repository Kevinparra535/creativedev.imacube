import { useBox } from "@react-three/cannon";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import { BOOKS_LIBRARY, type BookContent } from "../data/booksLibrary";

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

interface BookProps {
  position: [number, number, number];
  rotation: [number, number, number];
  size?: [number, number, number];
  bookContent: BookContent;
  onReady?: (mesh: THREE.Mesh) => void;
  [key: string]: unknown;
}

export function Book({
  position,
  rotation,
  size = [1.5, 1, 0.15],
  bookContent,
  onReady,
  ...props
}: BookProps) {
  const color = new THREE.Color(bookContent.color).getHex();
  
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
    <mesh
      ref={(mesh) => {
        // @ts-expect-error ref type mismatch
        ref.current = mesh;
        if (mesh) {
          // Annotate mesh with complete book data for reading system
          mesh.userData.bookContent = bookContent;
          mesh.userData.domain = bookContent.propiedades.conocimientos[0] || "Literatura";
          mesh.userData.difficulty = bookContent.dificultad;
          if (onReady) onReady(mesh);
        }
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshLambertMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export function Books({
  length = 50,
  onBookReady,
}: {
  length?: number;
  onBookReady?: (mesh: THREE.Mesh) => void;
}) {
  const [books] = useState(() => {
    const sandboxSize = 100;
    const halfSize = sandboxSize / 2;
    const minY = 0.5;
    const maxY = 15;
    const items = [];

    for (let i = 0; i < length; i++) {
      // Select random book from library
      const bookContent = BOOKS_LIBRARY[Math.floor(Math.random() * BOOKS_LIBRARY.length)];
      
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
        bookContent,
      });
    }

    return items;
  });

  return (
    <>
      {books.map((book) => (
        <Book key={book.id} {...book} onReady={onBookReady} />
      ))}
    </>
  );
}
