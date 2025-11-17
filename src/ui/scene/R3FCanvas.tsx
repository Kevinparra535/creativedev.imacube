import { Suspense, useEffect, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { CameraControls } from "@react-three/drei";
import { TextureLoader } from "three";
import {
  Selection,
  EffectComposer,
  Outline,
} from "@react-three/postprocessing";
import Cube from "./components/Cube";
import SandBox from "./objects/SandBox";
import Ambients from "./objects/Ambients";
import { Books } from "./objects/Books";

export default function R3FCanvas() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hopSignal, setHopSignal] = useState(0);

  const iceTextureMap = useLoader(TextureLoader, "/textures/ice_texture.jpg");
  const lavaTextureMap = useLoader(TextureLoader, "/textures/lava_texture.jpg");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setHopSignal((s: number) => s + 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Canvas dpr={[1, 2]} shadows camera={{ position: [-10, 5, 10], fov: 50 }}>
      <ambientLight intensity={Math.PI / 2} />
      {/* <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} /> */}

      <directionalLight
        position={[0, 100, 0]}
        castShadow
        shadow-mapSize={[2024, 2024]}
      />

      <Suspense fallback={null}>
        <Physics
          gravity={[0, -9.8, 0]}
          defaultContactMaterial={{
            restitution: 0.8,
            friction: 0.1,
            contactEquationStiffness: 1e7,
            contactEquationRelaxation: 3,
          }}
        >
          <SandBox />

          <Ambients groupPosition={[-40, 0, -40]} textureMap={iceTextureMap} />
          <Ambients groupPosition={[40, 0, -40]} textureMap={lavaTextureMap} />

          <Books length={20} />

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
      </Suspense>
    </Canvas>
  );
}
