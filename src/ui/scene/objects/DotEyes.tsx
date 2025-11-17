import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

export interface DotEyesProps {
  position?: [number, number, number];
  look?: [number, number]; // target dot offset
  eyeScale?: [number, number]; // overall scale for size adjustments
}

export function DotEyes({
  position = [0, 0.12, 0.51],
  look = [0, 0],
  eyeScale = [1, 1],
}: DotEyesProps) {
  const leftEyeRef = useRef<Group | null>(null);
  const rightEyeRef = useRef<Group | null>(null);
  const leftDotRef = useRef<Mesh | null>(null);
  const rightDotRef = useRef<Mesh | null>(null);
  const leftSparkRef = useRef<Mesh | null>(null);
  const rightSparkRef = useRef<Mesh | null>(null);

  const curLook = useRef<[number, number]>([0, 0]);
  const curScale = useRef<[number, number]>([1, 1]);
  const blink = useRef(1);
  const targetBlink = useRef(1);
  const nextBlinkAt = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const ek = 12;
    curLook.current[0] += (look[0] - curLook.current[0]) * Math.min(1, ek * delta);
    curLook.current[1] += (look[1] - curLook.current[1]) * Math.min(1, ek * delta);
    curScale.current[0] += (eyeScale[0] - curScale.current[0]) * Math.min(1, ek * delta);
    curScale.current[1] += (eyeScale[1] - curScale.current[1]) * Math.min(1, ek * delta);

    // Blink schedule (subtle for dot eyes)
    if (t >= nextBlinkAt.current) {
      targetBlink.current = targetBlink.current === 1 ? 0.2 : 1;
      nextBlinkAt.current = t + 3 + Math.random() * 5;
    }
    const bk = 16;
    blink.current += (targetBlink.current - blink.current) * Math.min(1, bk * delta);
    if (Math.abs(blink.current - targetBlink.current) < 0.02 && targetBlink.current < 0.5) {
      targetBlink.current = 1;
    }

    const [sx, sy] = curScale.current;
    const blinkY = sy * blink.current;
    if (leftEyeRef.current) leftEyeRef.current.scale.set(sx, blinkY, 1);
    if (rightEyeRef.current) rightEyeRef.current.scale.set(sx, blinkY, 1);

    // Clamp dot within an implied eye orbit
    let ox = curLook.current[0];
    let oy = curLook.current[1];
    const dotR = 0.055;
    const whiteR = 0.14; // implied orbit similar to BubbleEyes
    const margin = 0.012;
    const maxDotOffset = Math.max(whiteR - dotR - margin, 0.0); // ~0.073
    const len = Math.hypot(ox, oy) || 1;
    if (len > maxDotOffset && len > 0) {
      const k = maxDotOffset / len;
      ox *= k;
      oy *= k;
    }
    if (leftDotRef.current) leftDotRef.current.position.set(ox, oy, 0.005);
    if (rightDotRef.current) rightDotRef.current.position.set(ox, oy, 0.005);

    const sparkX = ox + 0.012;
    const sparkY = oy + 0.016;
    if (leftSparkRef.current) leftSparkRef.current.position.set(sparkX, sparkY, 0.007);
    if (rightSparkRef.current) rightSparkRef.current.position.set(sparkX, sparkY, 0.007);
  });

  return (
    <group position={position}>
      {/* Left eye as a dot */}
      <group ref={leftEyeRef} position={[-0.16, 0, 0]}>
        <mesh ref={leftDotRef} position={[0, 0, 0.005]}>
          <circleGeometry args={[0.055, 20]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh ref={leftSparkRef} position={[0.015, 0.02, 0.007]}>
          <circleGeometry args={[0.012, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* Right eye as a dot */}
      <group ref={rightEyeRef} position={[0.16, 0, 0]}>
        <mesh ref={rightDotRef} position={[0, 0, 0.005]}>
          <circleGeometry args={[0.055, 20]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh ref={rightSparkRef} position={[0.015, 0.02, 0.007]}>
          <circleGeometry args={[0.012, 12]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} />
        </mesh>
      </group>
    </group>
  );
}
