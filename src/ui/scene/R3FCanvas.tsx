import { Canvas } from "@react-three/fiber";
import { Physics, useBox, usePlane } from "@react-three/cannon";
import { CameraControls } from "@react-three/drei";
interface PlaneProps {
  rotation?: [number, number, number];
  args?: [number, number];
  [key: string]: unknown;
}

interface CubeProps {
  position?: [number, number, number];
  [key: string]: unknown;
}

function Cube(props: CubeProps) {
  const [ref] = useBox(() => ({ mass: 1, ...props }));
  return (
    <mesh castShadow ref={ref}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

function Plane({ rotation, args = [300, 300], ...rest }: PlaneProps) {
  const [ref] = usePlane(() => ({ rotation, ...rest }));
  return (
    <mesh receiveShadow ref={ref}>
      <planeGeometry args={args} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
}


const planeSize = 100;
const floorSize = 100;

const R3FCanvas = () => {
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
      <Physics>
        {/* Sandbox - Cubo cerrado con 6 paredes */}

        {/* Piso (abajo) */}
        <Plane
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          args={[floorSize, floorSize]}
        />

        {/* Techo (arriba) */}
        <Plane
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, planeSize, 0]}
          args={[planeSize, planeSize]}
        />

        {/* Pared frontal */}
        <Plane rotation={[0, 0, 0]} position={[0, planeSize / 2, -planeSize / 2]} args={[planeSize, planeSize]} />
        {/* Pared trasera */}
        <Plane
          rotation={[0, Math.PI, 0]}
          position={[0, planeSize / 2, planeSize / 2]}
          args={[planeSize, planeSize]}
        />

        {/* Pared izquierda */}
        <Plane
          rotation={[0, Math.PI / 2, 0]}
          position={[-planeSize / 2, planeSize / 2, 0]}
          args={[planeSize, planeSize]}
        />

        {/* Pared derecha */}
        <Plane
          rotation={[0, -Math.PI / 2, 0]}
          position={[planeSize / 2, planeSize / 2, 0]}
          args={[planeSize, planeSize]}
        />

        {/* Cubos para interactuar dentro del sandbox */}
        <Cube position={[0, 8, 0]} />
        <Cube position={[1, 7, 1]} />
        <Cube position={[-1, 6, -1]} />
        <Cube position={[2, 9, -2]} />
        <Cube position={[-2, 5, 2]} />
      </Physics>
      <CameraControls />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
    </Canvas>
  );
};

export default R3FCanvas;
