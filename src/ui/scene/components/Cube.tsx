import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import type { Triplet } from "@react-three/cannon";
import type { Group, Mesh } from "three";
import { Euler, Quaternion, Vector3 } from "three";
import "../../styles/ThoughtBubble.css";

export interface CubeProps {
  id: string;
  selected?: boolean;
  hopSignal?: number;
  auto?: boolean;
  onSelect?: (id: string) => void;
  position?: Triplet;
  [key: string]: unknown;
}

export default function Cube({
  id,
  selected = false,
  hopSignal = 0,
  auto = true,
  onSelect,
  ...props
}: CubeProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    material: { restitution: 0.9, friction: 0.1 },
    linearDamping: 0.3,
    angularDamping: 0.3,
    ...props,
  }));

  const [hovered, setHovered] = useState(false);
  const [thought, setThought] = useState<string>("...");

  const phase = useRef<"idle" | "squash" | "air" | "land" | "settle">("idle");
  const phaseStart = useRef(0);
  const nextHopAt = useRef(0);
  const dir = useRef<[number, number]>([0, 0]);
  const targetScale = useRef<[number, number, number]>([1, 1, 1]);
  const scaleNow = useRef<[number, number, number]>([1, 1, 1]);
  const yPos = useRef(0);
  const velY = useRef(0);
  const lastHopSignal = useRef(0);
  const lastPhase = useRef<"idle" | "squash" | "air" | "land" | "settle">(
    "idle"
  );

  // Orientation/self-righting state
  const quatRef = useRef<[number, number, number, number]>([0, 0, 0, 1]);
  const uprightTarget = useRef<Quaternion | null>(null);
  const tmpQ = useRef(new Quaternion());
  const tmpEuler = useRef(new Euler(0, 0, 0, "YXZ"));
  const tmpUp = useRef(new Vector3());

  // Eyes state (cartoon expressions)
  const leftEyeRef = useRef<Group | null>(null);
  const rightEyeRef = useRef<Group | null>(null);
  const leftPupilRef = useRef<Mesh | null>(null);
  const rightPupilRef = useRef<Mesh | null>(null);
  const leftIrisRef = useRef<Mesh | null>(null);
  const rightIrisRef = useRef<Mesh | null>(null);
  const leftSparkRef = useRef<Mesh | null>(null);
  const rightSparkRef = useRef<Mesh | null>(null);
  const eyeScale = useRef<[number, number]>([1, 1]);
  const targetEyeScale = useRef<[number, number]>([1, 1]);
  const pupilOffset = useRef<[number, number]>([0, 0]);
  const targetPupilOffset = useRef<[number, number]>([0, 0]);
  const blink = useRef(1);
  const targetBlink = useRef(1);
  const nextBlinkAt = useRef(0);

  // Map thought/phase to eye expression targets
  useEffect(() => {
    const txt = (thought || "").toLowerCase();
    let mood: "neutral" | "prep" | "air" | "land" | "curious" = "neutral";
    if (txt.includes("preparando")) mood = "prep";
    else if (txt.includes("weee")) mood = "air";
    else if (txt.includes("plof")) mood = "land";
    else if (
      txt.includes("hmm") ||
      txt.includes("¿") ||
      txt.includes("zig") ||
      txt.includes("bonito")
    )
      mood = "curious";

    switch (mood) {
      case "prep":
        targetEyeScale.current = [1.2, 0.65];
        targetPupilOffset.current = [0, -0.04];
        break;
      case "air":
        targetEyeScale.current = [1.3, 1.3];
        targetPupilOffset.current = [0, 0.08];
        break;
      case "land":
        targetEyeScale.current = [1.4, 0.5];
        targetPupilOffset.current = [0.02, -0.06];
        break;
      case "curious":
        targetEyeScale.current = [1.05, 1];
        targetPupilOffset.current = [0.08, 0];
        break;
      default:
        targetEyeScale.current = [1, 1];
        targetPupilOffset.current = [0, 0];
    }
  }, [thought]);

  useEffect(() => {
    const unsubPos = api.position.subscribe(([, y]) => {
      yPos.current = y;
    });
    const unsubVel = api.velocity.subscribe(([, vy]) => {
      velY.current = vy;
    });
    return () => {
      unsubPos();
      unsubVel();
    };
  }, [api.position, api.velocity]);

  // Subscribe to quaternion to track current orientation
  useEffect(() => {
    const unsubQuat = api.quaternion.subscribe(([x, y, z, w]) => {
      quatRef.current = [x, y, z, w];
    });
    return () => {
      unsubQuat();
    };
  }, [api.quaternion]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (!auto) {
      if (
        selected &&
        hopSignal !== lastHopSignal.current &&
        phase.current === "idle"
      ) {
        lastHopSignal.current = hopSignal;
        phase.current = "squash";
        phaseStart.current = t;
        targetScale.current = [1.25, 0.75, 1.25];
      }
    } else if (phase.current === "idle" && t >= nextHopAt.current) {
      phase.current = "squash";
      phaseStart.current = t;
      targetScale.current = [1.25, 0.75, 1.25];
    }

    if (phase.current === "squash" && t - phaseStart.current > 0.18) {
      const angle = Math.random() * Math.PI * 2;
      const mag = 0.6 + Math.random() * 0.6;
      dir.current = [Math.cos(angle) * mag, Math.sin(angle) * mag];
      api.applyImpulse(
        [dir.current[0] * 1.2, 3.2, dir.current[1] * 1.2],
        [0, 0, 0]
      );
      phase.current = "air";
      phaseStart.current = t;
      targetScale.current = [0.9, 1.1, 0.9];
    }

    if (phase.current === "air") {
      if (yPos.current <= 0.52 && velY.current < -0.2) {
        phase.current = "land";
        phaseStart.current = t;
        targetScale.current = [1.3, 0.7, 1.3];
      }
    }

    if (phase.current === "land" && t - phaseStart.current > 0.12) {
      phase.current = "settle";
      phaseStart.current = t;
      targetScale.current = [1, 1, 1];
      if (auto) nextHopAt.current = t + (0.9 + Math.random() * 1.4);
    }

    const k = 10;
    const s = scaleNow.current;
    const trg = targetScale.current;
    s[0] += (trg[0] - s[0]) * Math.min(1, k * delta);
    s[1] += (trg[1] - s[1]) * Math.min(1, k * delta);
    s[2] += (trg[2] - s[2]) * Math.min(1, k * delta);
    if (ref.current) ref.current.scale.set(s[0], s[1], s[2]);

    // Lerp eye scale + pupil offset
    const ek = 12;
    eyeScale.current[0] +=
      (targetEyeScale.current[0] - eyeScale.current[0]) *
      Math.min(1, ek * delta);
    eyeScale.current[1] +=
      (targetEyeScale.current[1] - eyeScale.current[1]) *
      Math.min(1, ek * delta);
    pupilOffset.current[0] +=
      (targetPupilOffset.current[0] - pupilOffset.current[0]) *
      Math.min(1, ek * delta);
    pupilOffset.current[1] +=
      (targetPupilOffset.current[1] - pupilOffset.current[1]) *
      Math.min(1, ek * delta);
    // Gentle random blink scheduling
    if (t >= nextBlinkAt.current) {
      // Start a blink occasionally
      if (targetBlink.current === 1) targetBlink.current = 0.1;
      else targetBlink.current = 1;
      // Next blink between 2-6s
      nextBlinkAt.current = t + 2 + Math.random() * 4;
    }
    const bk = 20;
    blink.current +=
      (targetBlink.current - blink.current) * Math.min(1, bk * delta);
    if (
      Math.abs(blink.current - targetBlink.current) < 0.02 &&
      targetBlink.current < 0.5
    ) {
      // Close reached, open back up
      targetBlink.current = 1;
    }
    const [sx, sy] = eyeScale.current;
    const blinkY = sy * blink.current;
    if (leftEyeRef.current) leftEyeRef.current.scale.set(sx, blinkY, 1);
    if (rightEyeRef.current) rightEyeRef.current.scale.set(sx, blinkY, 1);
    if (leftPupilRef.current)
      leftPupilRef.current.position.set(
        pupilOffset.current[0],
        pupilOffset.current[1],
        0.005
      );
    if (rightPupilRef.current)
      rightPupilRef.current.position.set(
        pupilOffset.current[0],
        pupilOffset.current[1],
        0.005
      );
    // Iris follows pupils slightly for a cute look
    if (leftIrisRef.current)
      leftIrisRef.current.position.set(
        pupilOffset.current[0] * 0.6,
        pupilOffset.current[1] * 0.6,
        0.003
      );
    if (rightIrisRef.current)
      rightIrisRef.current.position.set(
        pupilOffset.current[0] * 0.6,
        pupilOffset.current[1] * 0.6,
        0.003
      );
    // Spark highlight offsets slightly toward top-right and tracks look a bit
    const sparkX = 0.045 + pupilOffset.current[0] * 0.3;
    const sparkY = 0.055 + pupilOffset.current[1] * 0.3;
    if (leftSparkRef.current)
      leftSparkRef.current.position.set(sparkX, sparkY, 0.007);
    if (rightSparkRef.current)
      rightSparkRef.current.position.set(sparkX, sparkY, 0.007);

    if (lastPhase.current !== phase.current) {
      lastPhase.current = phase.current;
      switch (phase.current) {
        case "squash":
          setThought("Preparando salto...");
          break;
        case "air":
          setThought("¡Weee!");
          break;
        case "land":
          setThought("¡Plof!");
          break;
        case "settle":
          setThought("Listo otra vez.");
          break;
        default:
          setThought("...");
      }
    }

    // Self-righting: detect tilt and gently re-orient upright
    // Compute current up-vector in world space
    const q = tmpQ.current.set(
      quatRef.current[0],
      quatRef.current[1],
      quatRef.current[2],
      quatRef.current[3]
    );
    const up = tmpUp.current.set(0, 1, 0).applyQuaternion(q);
    const dot = Math.max(-1, Math.min(1, up.y));
    const tilt = Math.acos(dot); // radians from world-up

    // If significantly tilted and we don't already have a target, compute it
    if (tilt > 0.6 && uprightTarget.current == null) {
      const e = tmpEuler.current.setFromQuaternion(q, "YXZ");
      const yaw = e.y;
      uprightTarget.current = new Quaternion().setFromEuler(
        new Euler(0, yaw, 0, "YXZ")
      );
      if (phase.current === "idle") {
        phase.current = "squash";
        phaseStart.current = t;
        targetScale.current = [1.25, 0.75, 1.25];
      }
    }

    // If we have a target upright orientation, slerp towards it
    if (uprightTarget.current) {
      // Dampen spin while correcting
      api.angularVelocity.set(0, 0, 0);
      const alpha = Math.min(1, 8 * delta);
      q.slerp(uprightTarget.current, alpha);
      api.quaternion.set(q.x, q.y, q.z, q.w);

      // Clear target when aligned closely during settle/idle
      if (
        q.angleTo(uprightTarget.current) < 0.02 &&
        (phase.current === "settle" || phase.current === "idle")
      ) {
        api.quaternion.set(
          uprightTarget.current.x,
          uprightTarget.current.y,
          uprightTarget.current.z,
          uprightTarget.current.w
        );
        uprightTarget.current = null;
      }
    }
  });

  useEffect(() => {
    let mounted = true;
    const ideas = ["hmm...", "¿Salto?", "qué bonito cubo", "zig zag", "***"];
    const tick = () => {
      if (mounted && phase.current === "idle")
        setThought(ideas[Math.floor(Math.random() * ideas.length)]);
      timer = window.setTimeout(tick, 2000 + Math.random() * 2000);
    };
    let timer = window.setTimeout(tick, 1500);
    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Select enabled={hovered || selected}>
      <mesh
        castShadow
        ref={ref}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
      >
        <boxGeometry />
        <meshStandardMaterial
          color={selected ? "#00d8ff" : hovered ? "hotpink" : "gray"}
        />

        {/* Cartoon Bubble Eyes on the +Z face (friendly & cute) */}
        <group position={[0, 0.12, 0.51]}>
          {/* Left eye */}
          <group ref={leftEyeRef} position={[-0.16, 0, 0]}>
            {/* Outline ring */}
            <mesh position={[0, 0, 0.001]}>
              <ringGeometry args={[0.132, 0.145, 40]} />
              <meshStandardMaterial
                color="#222222"
                emissive="#000000"
                roughness={1}
                metalness={0}
              />
            </mesh>
            {/* Eye white */}
            <mesh>
              <circleGeometry args={[0.14, 40]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.12}
                roughness={0.3}
                metalness={0}
              />
            </mesh>
            {/* Iris */}
            <mesh ref={leftIrisRef} position={[0, 0, 0.003]}>
              <circleGeometry args={[0.08, 36]} />
              <meshStandardMaterial
                color="#66b3ff"
                emissive="#66b3ff"
                emissiveIntensity={0.05}
              />
            </mesh>
            {/* Pupil */}
            <mesh ref={leftPupilRef} position={[0, 0, 0.005]}>
              <circleGeometry args={[0.045, 28]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
            {/* Highlight */}
            <mesh ref={leftSparkRef} position={[0.045, 0.055, 0.007]}>
              <circleGeometry args={[0.02, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
          {/* Right eye */}
          <group ref={rightEyeRef} position={[0.16, 0, 0]}>
            <mesh position={[0, 0, 0.001]}>
              <ringGeometry args={[0.132, 0.145, 40]} />
              <meshStandardMaterial
                color="#222222"
                emissive="#000000"
                roughness={1}
                metalness={0}
              />
            </mesh>
            <mesh>
              <circleGeometry args={[0.14, 40]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.12}
                roughness={0.3}
                metalness={0}
              />
            </mesh>
            <mesh ref={rightIrisRef} position={[0, 0, 0.003]}>
              <circleGeometry args={[0.08, 36]} />
              <meshStandardMaterial
                color="#66b3ff"
                emissive="#66b3ff"
                emissiveIntensity={0.05}
              />
            </mesh>
            <mesh ref={rightPupilRef} position={[0, 0, 0.005]}>
              <circleGeometry args={[0.045, 28]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
            <mesh ref={rightSparkRef} position={[0.045, 0.055, 0.007]}>
              <circleGeometry args={[0.02, 16]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        </group>

        <Html position={[0, 1.4, 0]} occlude={true} transform sprite>
          <div
            className={`thought-bubble ${selected ? "thought--selected" : hovered ? "thought--hovered" : "thought--default"}`}
          >
            <div className="thought-badge">{id}</div>
            <div className="thought-text">{thought}</div>
            <div className="thought-tail" />
          </div>
        </Html>
      </mesh>
    </Select>
  );
}
