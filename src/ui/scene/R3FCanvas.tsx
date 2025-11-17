import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { CameraControls } from "@react-three/drei";
import { Selection, EffectComposer, Outline } from "@react-three/postprocessing";
import Plane from "./components/Plane";
import Cube from "./components/Cube";


const planeSize = 100;
const floorSize = 100;

export default function R3FCanvas() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hopSignal, setHopSignal] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setHopSignal((s: number) => s + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Canvas dpr={[1, 2]} shadows camera={{ position: [-5, 5, 5], fov: 50 }}>
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <Physics
        gravity={[0, -9.8, 0]}
        defaultContactMaterial={{
          restitution: 0.8,
          friction: 0.1,
          contactEquationStiffness: 1e7,
          contactEquationRelaxation: 3,
        }}
      >
        <Plane
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          args={[floorSize, floorSize]}
        />
        <Plane
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, planeSize, 0]}
          args={[planeSize, planeSize]}
        />
        <Plane
          rotation={[0, 0, 0]}
          position={[0, planeSize / 2, -planeSize / 2]}
          args={[planeSize, planeSize]}
        />
        <Plane
          rotation={[0, Math.PI, 0]}
          position={[0, planeSize / 2, planeSize / 2]}
          args={[planeSize, planeSize]}
        />
        <Plane
          rotation={[0, Math.PI / 2, 0]}
          position={[-planeSize / 2, planeSize / 2, 0]}
          args={[planeSize, planeSize]}
        />
        <Plane
          rotation={[0, -Math.PI / 2, 0]}
          position={[planeSize / 2, planeSize / 2, 0]}
          args={[planeSize, planeSize]}
        />

        <Selection>
          <EffectComposer multisampling={8} autoClear={false}>
            <Outline
              blur
              visibleEdgeColor={0xffffff}
              edgeStrength={6}
              width={2}
            />
          </EffectComposer>

          <group onPointerMissed={() => setSelectedId(null)}>
            <Cube
              id="c1"
              position={[0, 8, 0]}
              auto={false}
              selected={selectedId === "c1"}
              hopSignal={hopSignal}
              onSelect={setSelectedId}
            />
            <Cube
              id="c2"
              position={[1, 7, 1]}
              auto={false}
              selected={selectedId === "c2"}
              hopSignal={hopSignal}
              onSelect={setSelectedId}
            />
            <Cube
              id="c3"
              position={[-1, 6, -1]}
              auto={false}
              selected={selectedId === "c3"}
              hopSignal={hopSignal}
              onSelect={setSelectedId}
            />
            <Cube
              id="c4"
              position={[2, 9, -2]}
              auto={false}
              selected={selectedId === "c4"}
              hopSignal={hopSignal}
              onSelect={setSelectedId}
            />
            <Cube
              id="c5"
              position={[-2, 5, 2]}
              auto={false}
              selected={selectedId === "c5"}
              hopSignal={hopSignal}
              onSelect={setSelectedId}
            />
          </group>
        </Selection>
      </Physics>
      <CameraControls />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
    </Canvas>
  );
}
