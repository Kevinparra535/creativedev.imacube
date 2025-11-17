import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

export interface BubbleEyesProps {
  position?: [number, number, number];
  look?: [number, number]; // target pupil offset
  eyeScale?: [number, number]; // target eye scale
}

export function BubbleEyes({
  position = [0, 0.12, 0.51],
  look = [0, 0],
  eyeScale = [1, 1],
}: BubbleEyesProps) {
  const leftEyeRef = useRef<Group | null>(null);
  const rightEyeRef = useRef<Group | null>(null);
  const leftIrisRef = useRef<Mesh | null>(null);
  const rightIrisRef = useRef<Mesh | null>(null);
  const leftPupilRef = useRef<Mesh | null>(null);
  const rightPupilRef = useRef<Mesh | null>(null);
  const leftSparkRef = useRef<Mesh | null>(null);
  const rightSparkRef = useRef<Mesh | null>(null);

  const curEyeScale = useRef<[number, number]>([1, 1]);
  const curLook = useRef<[number, number]>([0, 0]);
  const blink = useRef(1);
  const targetBlink = useRef(1);
  const nextBlinkAt = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Lerp toward incoming targets
    const ek = 12;
    curEyeScale.current[0] +=
      (eyeScale[0] - curEyeScale.current[0]) * Math.min(1, ek * delta);
    curEyeScale.current[1] +=
      (eyeScale[1] - curEyeScale.current[1]) * Math.min(1, ek * delta);
    curLook.current[0] += (look[0] - curLook.current[0]) * Math.min(1, ek * delta);
    curLook.current[1] += (look[1] - curLook.current[1]) * Math.min(1, ek * delta);

    // Blink schedule
    if (t >= nextBlinkAt.current) {
      targetBlink.current = targetBlink.current === 1 ? 0.1 : 1;
      nextBlinkAt.current = t + 2 + Math.random() * 4;
    }
    const bk = 20;
    blink.current += (targetBlink.current - blink.current) * Math.min(1, bk * delta);
    if (Math.abs(blink.current - targetBlink.current) < 0.02 && targetBlink.current < 0.5) {
      targetBlink.current = 1;
    }

    const [sx, sy] = curEyeScale.current;
    const blinkY = sy * blink.current;
    if (leftEyeRef.current) leftEyeRef.current.scale.set(sx, blinkY, 1);
    if (rightEyeRef.current) rightEyeRef.current.scale.set(sx, blinkY, 1);

    // Apply look offsets
    const ox = curLook.current[0];
    const oy = curLook.current[1];
    if (leftPupilRef.current) leftPupilRef.current.position.set(ox, oy, 0.005);
    if (rightPupilRef.current) rightPupilRef.current.position.set(ox, oy, 0.005);
    if (leftIrisRef.current) leftIrisRef.current.position.set(ox * 0.6, oy * 0.6, 0.003);
    if (rightIrisRef.current) rightIrisRef.current.position.set(ox * 0.6, oy * 0.6, 0.003);

    const sparkX = 0.045 + ox * 0.3;
    const sparkY = 0.055 + oy * 0.3;
    if (leftSparkRef.current) leftSparkRef.current.position.set(sparkX, sparkY, 0.007);
    if (rightSparkRef.current) rightSparkRef.current.position.set(sparkX, sparkY, 0.007);
  });

  return (
    <group position={position}>
      {/* Left eye */}
      <group ref={leftEyeRef} position={[-0.16, 0, 0]}>
        {/* Outline ring */}
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.132, 0.145, 40]} />
          <meshStandardMaterial color="#222222" emissive="#000000" roughness={1} metalness={0} />
        </mesh>
        {/* White */}
        <mesh>
          <circleGeometry args={[0.14, 40]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.12} roughness={0.3} metalness={0} />
        </mesh>
        {/* Iris */}
        <mesh ref={leftIrisRef} position={[0, 0, 0.003]}>
          <circleGeometry args={[0.08, 36]} />
          <meshStandardMaterial color="#66b3ff" emissive="#66b3ff" emissiveIntensity={0.05} />
        </mesh>
        {/* Pupil */}
        <mesh ref={leftPupilRef} position={[0, 0, 0.005]}>
          <circleGeometry args={[0.045, 28]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Highlight */}
        <mesh ref={leftSparkRef} position={[0.045, 0.055, 0.007]}>
          <circleGeometry args={[0.02, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Right eye */}
      <group ref={rightEyeRef} position={[0.16, 0, 0]}>
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.132, 0.145, 40]} />
          <meshStandardMaterial color="#222222" emissive="#000000" roughness={1} metalness={0} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.14, 40]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.12} roughness={0.3} metalness={0} />
        </mesh>
        <mesh ref={rightIrisRef} position={[0, 0, 0.003]}>
          <circleGeometry args={[0.08, 36]} />
          <meshStandardMaterial color="#66b3ff" emissive="#66b3ff" emissiveIntensity={0.05} />
        </mesh>
        <mesh ref={rightPupilRef} position={[0, 0, 0.005]}>
          <circleGeometry args={[0.045, 28]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh ref={rightSparkRef} position={[0.045, 0.055, 0.007]}>
          <circleGeometry args={[0.02, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}
