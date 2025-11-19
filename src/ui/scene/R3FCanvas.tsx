import {
  Suspense,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { CameraControls } from "@react-three/drei";
import { TextureLoader } from "three";
import type { Mesh } from "three";
import {
  Selection,
  EffectComposer,
  Outline,
} from "@react-three/postprocessing";
import Cube from "./components/Cube";
import type { CubeProps } from "./components/Cube";
import SandBox from "./objects/SandBox";
import Ambients from "./objects/Ambients";
import { Books } from "./objects/Books";
import { CUBES_CONFIG } from "../../config/cubesConfig";
import Mirror from "./objects/Mirror";
import { FollowCamera } from "../utils/FollowCamera";

interface R3FCanvasProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  cameraLocked: boolean;
  onCameraLockChange: (locked: boolean) => void;
}

export default function R3FCanvas({
  selectedId,
  onSelect,
  cameraLocked,
  onCameraLockChange,
}: R3FCanvasProps) {
  const [hopSignal, setHopSignal] = useState(0);
  const bookMeshes = useRef<Mesh[]>([]);
  const [bookTargets, setBookTargets] = useState<
    Array<{
      object: Mesh;
      type: "book";
      domain?: string;
      difficulty?: "basic" | "intermediate" | "advanced";
    }>
  >([]);
  const controlsRef = useRef<CameraControls | null>(null);
  const mirrorPosition: [number, number, number] = [-49.5, 5, 0]; // Mirror position on left wall

  // Ambient exploration zones
  const ambientZones = useMemo(
    () => [
      {
        position: [-40, 0, -40] as [number, number, number],
        type: "ice" as const,
      },
      {
        position: [40, 0, -40] as [number, number, number],
        type: "lava" as const,
      },
    ],
    []
  );

  // All cube IDs for social exploration
  const allCubeIds = useMemo(() => CUBES_CONFIG.map((c) => c.id), []);

  const iceTextureMap = useLoader(TextureLoader, "/textures/ice_texture.jpg");
  const lavaTextureMap = useLoader(TextureLoader, "/textures/lava_texture.jpg");

  const handleBookReady = useCallback((mesh: Mesh) => {
    if (!bookMeshes.current.includes(mesh)) {
      bookMeshes.current.push(mesh);
      setBookTargets((prev) => [
        ...prev,
        {
          object: mesh,
          type: "book",
          domain: mesh.userData?.domain,
          difficulty: mesh.userData?.difficulty,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        e.preventDefault();
        if (selectedId) {
          onCameraLockChange(!cameraLocked);
        } else {
          setHopSignal((s: number) => s + 1);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, cameraLocked, onCameraLockChange]);

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

          <Mirror rotation={[0, Math.PI / 2, 0]} position={[-49.5, 5, 0]} />

          <Ambients groupPosition={[-40, 0, -40]} textureMap={iceTextureMap} />
          <Ambients groupPosition={[40, 0, -40]} textureMap={lavaTextureMap} />

          <Books length={20} onBookReady={handleBookReady} />

          <Selection>
            <EffectComposer multisampling={8} autoClear={false}>
              <Outline
                blur
                visibleEdgeColor={0xffffff}
                edgeStrength={6}
                width={2}
              />
            </EffectComposer>

            <group onPointerMissed={() => onSelect("")}>
              {CUBES_CONFIG.map((cube) => (
                <Cube
                  key={cube.id}
                  id={cube.id}
                  position={cube.position}
                  auto={cube.auto}
                  personality={cube.personality as CubeProps["personality"]}
                  eyeStyle={cube.eyeStyle as CubeProps["eyeStyle"]}
                  selected={selectedId === cube.id}
                  hopSignal={hopSignal}
                  onSelect={onSelect}
                  bookTargets={bookTargets}
                  mirrorPosition={mirrorPosition}
                  allCubeIds={allCubeIds}
                  ambientZones={ambientZones}
                />
              ))}
            </group>
          </Selection>
        </Physics>
        <CameraControls ref={controlsRef} />
        <FollowCamera
          selectedId={selectedId}
          controlsRef={controlsRef}
          locked={cameraLocked}
        />
      </Suspense>
    </Canvas>
  );
}
