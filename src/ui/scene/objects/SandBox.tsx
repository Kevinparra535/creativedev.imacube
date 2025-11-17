import Plane from "../components/Plane";

const PLANE_SIZE = 100;
const FLOOR_SIZE = 100;

const SandBox = () => {
  return (
    <>
      <Plane
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        args={[FLOOR_SIZE, FLOOR_SIZE]}
      />
      <Plane
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, PLANE_SIZE, 0]}
        args={[PLANE_SIZE, PLANE_SIZE]}
      />
      <Plane
        rotation={[0, 0, 0]}
        position={[0, PLANE_SIZE / 2, -PLANE_SIZE / 2]}
        args={[PLANE_SIZE, PLANE_SIZE]}
      />
      <Plane
        rotation={[0, Math.PI, 0]}
        position={[0, PLANE_SIZE / 2, PLANE_SIZE / 2]}
        args={[PLANE_SIZE, PLANE_SIZE]}
      />
      <Plane
        rotation={[0, Math.PI / 2, 0]}
        position={[-PLANE_SIZE / 2, PLANE_SIZE / 2, 0]}
        args={[PLANE_SIZE, PLANE_SIZE]}
      />
      <Plane
        rotation={[0, -Math.PI / 2, 0]}
        position={[PLANE_SIZE / 2, PLANE_SIZE / 2, 0]}
        args={[PLANE_SIZE, PLANE_SIZE]}
      />
    </>
  );
};

export default SandBox;
