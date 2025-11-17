import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

export interface DotEyesProps {
  position?: [number, number, number];
  look?: [number, number]; // target dot offset
  eyeScale?: [number, number]; // overall scale for size adjustments
  mood?: "neutral" | "prep" | "air" | "land" | "curious" | "happy" | "angry" | "sad";
}

export function DotEyes({
  position = [0, 0.12, 0.51],
  look = [0, 0],
  eyeScale = [1, 1],
  mood = "neutral",
}: DotEyesProps) {
  const leftEyeRef = useRef<Group | null>(null);
  const rightEyeRef = useRef<Group | null>(null);
  const leftDotRef = useRef<Mesh | null>(null);
  const rightDotRef = useRef<Mesh | null>(null);
  const leftSparkRef = useRef<Mesh | null>(null);
  const rightSparkRef = useRef<Mesh | null>(null);
  const leftBrowRef = useRef<Mesh | null>(null);
  const rightBrowRef = useRef<Mesh | null>(null);

  const curLook = useRef<[number, number]>([0, 0]);
  const curScale = useRef<[number, number]>([1, 1]);
  const blink = useRef(1);
  const targetBlink = useRef(1);
  const nextBlinkAt = useRef(0);

  // Brow animation state
  const curBrowY = useRef(0);
  const curBrowRotation = useRef(0);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    const scaleK = 8; // Eye scale lerp speed
    const lookK = 5;  // Look direction lerp speed (slower = smoother)
    curLook.current[0] += (look[0] - curLook.current[0]) * Math.min(1, lookK * delta);
    curLook.current[1] += (look[1] - curLook.current[1]) * Math.min(1, lookK * delta);
    curScale.current[0] += (eyeScale[0] - curScale.current[0]) * Math.min(1, scaleK * delta);
    curScale.current[1] += (eyeScale[1] - curScale.current[1]) * Math.min(1, scaleK * delta);

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
    const margin = 0.015;
    const maxDotOffset = Math.max(whiteR - dotR - margin, 0.0); // ~0.07
    const len = Math.hypot(ox, oy) || 1;
    if (len > maxDotOffset && len > 0) {
      const k = maxDotOffset / len;
      ox *= k;
      oy *= k;
    }
    if (leftDotRef.current) leftDotRef.current.position.set(ox, oy, 0.005);
    if (rightDotRef.current) rightDotRef.current.position.set(ox, oy, 0.005);

    // Sparkle moves with the dot as a unit (offset from dot center)
    const sparkX = ox + 0.018;
    const sparkY = oy + 0.022;
    if (leftSparkRef.current) leftSparkRef.current.position.set(sparkX, sparkY, 0.007);
    if (rightSparkRef.current) rightSparkRef.current.position.set(sparkX, sparkY, 0.007);

    // Eyebrow expression based on mood
    let targetBrowY = 0.22;
    let targetBrowRotation = 0;

    switch (mood) {
      case "prep": // Concentrado/Focused
        targetBrowY = 0.2;
        targetBrowRotation = -0.2; // Furrowed inward
        break;
      case "air": // En el aire (sorpresa)
        targetBrowY = 0.27;
        targetBrowRotation = 0.15; // Raised in surprise
        break;
      case "land": // Impacto
        targetBrowY = 0.18;
        targetBrowRotation = -0.1; // Slight frown
        break;
      case "happy": // Feliz
        targetBrowY = 0.26;
        targetBrowRotation = 0.18; // Arched upward
        break;
      case "curious": // Curioso
        targetBrowY = 0.24;
        targetBrowRotation = 0.12; // Slightly raised
        break;
      case "angry": // Enojado
        targetBrowY = 0.19;
        targetBrowRotation = -0.3; // Strong furrowed
        break;
      case "sad": // Triste
        targetBrowY = 0.21;
        targetBrowRotation = 0.2; // Raised inner corners
        break;
      default: // neutral
        targetBrowY = 0.22;
        targetBrowRotation = 0;
    }

    const browK = 6;
    curBrowY.current += (targetBrowY - curBrowY.current) * Math.min(1, browK * delta);
    curBrowRotation.current += (targetBrowRotation - curBrowRotation.current) * Math.min(1, browK * delta);

    if (leftBrowRef.current) {
      leftBrowRef.current.position.y = curBrowY.current;
      leftBrowRef.current.rotation.z = curBrowRotation.current;
    }
    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = curBrowY.current;
      rightBrowRef.current.rotation.z = -curBrowRotation.current;
    }
  });

  return (
    <group position={position}>
      {/* Left eyebrow */}
      <mesh ref={leftBrowRef} position={[-0.16, 0.22, 0.008]}>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0} />
      </mesh>

      {/* Right eyebrow */}
      <mesh ref={rightBrowRef} position={[0.16, 0.22, 0.008]}>
        <boxGeometry args={[0.12, 0.02, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0} />
      </mesh>

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
