import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
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
import { CUBES_CONFIG } from "./cubesConfig";
import { subscribe, getCube } from "./systems/Community";
// import Mirror from "./objects/Mirror";

interface R3FCanvasProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  cameraLocked: boolean;
  onCameraLockChange: (locked: boolean) => void;
}

export default function R3FCanvas({ selectedId, onSelect, cameraLocked, onCameraLockChange }: R3FCanvasProps) {
  const [hopSignal, setHopSignal] = useState(0);
  const bookMeshes = useRef<Mesh[]>([]);
  const [bookTargets, setBookTargets] = useState<Array<{ object: Mesh; type: "book"; domain?: string; difficulty?: "basic" | "intermediate" | "advanced" }>>([]);
  const controlsRef = useRef<CameraControls | null>(null);

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
      if (e.code === "Space") {
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

          {/* <Mirror /> */}

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
                />
              ))}
            </group>
          </Selection>
        </Physics>
        <CameraControls ref={controlsRef} />
        <FollowCamera selectedId={selectedId} controlsRef={controlsRef} locked={cameraLocked} />
      </Suspense>
    </Canvas>
  );
}

function FollowCamera({ selectedId, controlsRef, locked }: { selectedId: string | null; controlsRef: React.RefObject<CameraControls | null>; locked: boolean }) {
  const eye = useRef<[number, number, number]>([-10, 5, 10]);
  const target = useRef<[number, number, number] | null>(null);
  const followOffset = useRef<[number, number, number]>([-10, 6, 10]);
  const userInteracting = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const update = () => {
      if (!selectedId) {
        target.current = null;
        return;
      }
      const cube = getCube(selectedId);
      if (cube) target.current = cube.position;
    };
    update();
    unsub = subscribe(update);
    return () => {
      if (unsub) unsub();
    };
  }, [selectedId]);

  // Watch user interactions on controls to allow manual rotation while following
  useEffect(() => {
    const controls = controlsRef.current as any;
    if (!controls) return;
    const onStart = () => { userInteracting.current = true; };
    const onEnd = () => { userInteracting.current = false; };
    controls.addEventListener?.("controlstart", onStart);
    controls.addEventListener?.("controlend", onEnd);
    return () => {
      controls.removeEventListener?.("controlstart", onStart);
      controls.removeEventListener?.("controlend", onEnd);
    };
  }, [controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (!selectedId || !target.current || !locked) return;

    const [tx, ty, tz] = target.current;

    // If the user is rotating, keep their angle by updating the followOffset to current eye-target
    // and only move the target to the cube position so orbit stays interactive.
    if (userInteracting.current) {
      // Update offset from current camera position
      const pos = (controls as any).camera?.position;
      if (pos) {
        followOffset.current = [pos.x - tx, pos.y - (ty + 0.5), pos.z - tz];
      }
      controls.setTarget(tx, ty + 0.5, tz, false);
      return;
    }

    // Otherwise, smoothly move the eye to maintain the stored offset while following target
    const desiredEye: [number, number, number] = [
      tx + followOffset.current[0],
      ty + 0.5 + followOffset.current[1],
      tz + followOffset.current[2],
    ];
    const k = Math.min(1, delta * 2.5);
    eye.current[0] += (desiredEye[0] - eye.current[0]) * k;
    eye.current[1] += (desiredEye[1] - eye.current[1]) * k;
    eye.current[2] += (desiredEye[2] - eye.current[2]) * k;

    controls.setLookAt(
      eye.current[0],
      eye.current[1],
      eye.current[2],
      tx,
      ty + 0.5,
      tz,
      false
    );
  });

  return null;
}