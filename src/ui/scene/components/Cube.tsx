import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import type { Triplet } from "@react-three/cannon";
import { Euler, Quaternion, Vector3 } from "three";
import { BubbleEyes, DotEyes } from "../objects";
import "../../styles/ThoughtBubble.css";

export interface CubeProps {
  id: string;
  selected?: boolean;
  hopSignal?: number;
  auto?: boolean;
  eyeStyle?: "bubble" | "dot";
  onSelect?: (id: string) => void;
  position?: Triplet;
  [key: string]: unknown;
}

export default function Cube({
  id,
  selected = false,
  hopSignal = 0,
  auto = true,
  eyeStyle = "bubble",
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

  // Eyes targets derived from thought
  const { eyeTargetScale, eyeTargetLook } = useMemo(() => {
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
        return { eyeTargetScale: [1.2, 0.65] as [number, number], eyeTargetLook: [0, -0.04] as [number, number] };
      case "air":
        return { eyeTargetScale: [1.3, 1.3] as [number, number], eyeTargetLook: [0, 0.08] as [number, number] };
      case "land":
        return { eyeTargetScale: [1.4, 0.5] as [number, number], eyeTargetLook: [0.02, -0.06] as [number, number] };
      case "curious":
        return { eyeTargetScale: [1.05, 1] as [number, number], eyeTargetLook: [0.08, 0] as [number, number] };
      default:
        return { eyeTargetScale: [1, 1] as [number, number], eyeTargetLook: [0, 0] as [number, number] };
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

    // Eyes handled by eyes components now

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

        {/* Eyes on +Z face */}
        {eyeStyle === "bubble" ? (
          <BubbleEyes position={[0, 0.12, 0.51]} look={eyeTargetLook} eyeScale={eyeTargetScale} />
        ) : (
          <DotEyes position={[0, 0.12, 0.51]} look={eyeTargetLook} eyeScale={eyeTargetScale} />
        )}

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
