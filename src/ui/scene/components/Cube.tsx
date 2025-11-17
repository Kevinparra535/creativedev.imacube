import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import type { Triplet } from "@react-three/cannon";
import { Color, Euler, Quaternion, Vector3, Plane, MathUtils } from "three";
import type { MeshStandardMaterial } from "three";

import { BubbleEyes, DotEyes } from "../objects";
import { computeVisualTargets } from "../visual/visualState";
import type { Personality } from "../visual/visualState";

import "../../styles/ThoughtBubble.css";

export interface CubeProps {
  id: string;
  selected?: boolean;
  hopSignal?: number;
  auto?: boolean;
  eyeStyle?: "bubble" | "dot";
  personality?: Personality;
  learningPulseSignal?: number; // increment to trigger a learning pulse
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
  personality = "calm",
  learningPulseSignal = 0,
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
  const tmpPlane = useRef(new Plane());
  const tmpV1 = useRef(new Vector3());
  const tmpV2 = useRef(new Vector3());
  const tmpV3 = useRef(new Vector3());
  const tmpScale = useRef(new Vector3());

  // Eyes targets derived from thought and personality
  const { eyeTargetScale, eyeTargetLook, mood } = useMemo(() => {
    const txt = (thought || "").toLowerCase();
    let mood: "neutral" | "prep" | "air" | "land" | "curious" | "happy" | "angry" | "sad" = "neutral";
    
    // Priority 1: Physical jump phases (temporary emotional states)
    if (txt.includes("preparando")) mood = "prep";
    else if (txt.includes("weee") || txt.includes("!")) mood = "happy"; // Changed from "air" to "happy"
    else if (txt.includes("plof")) mood = "land";
    // Priority 2: Cognitive/emotional states
    else if (
      txt.includes("hmm") ||
      txt.includes("¿") ||
      txt.includes("?") ||
      txt.includes("zig") ||
      txt.includes("bonito")
    )
      mood = "curious";
    else if (txt.includes("triste") || txt.includes("😢"))
      mood = "sad";
    else if (txt.includes("enojado") || txt.includes("grr") || txt.includes("frustrado"))
      mood = "angry";
    // Priority 3: Personality baseline (only check personality, don't access phase ref)
    else {
      if (personality === "extrovert") mood = "happy";
      else if (personality === "chaotic") mood = "angry";
      else if (personality === "curious") mood = "curious";
    }

    switch (mood) {
      case "prep":
        return {
          eyeTargetScale: [1.2, 0.65] as [number, number],
          eyeTargetLook: [0, -0.04] as [number, number],
          mood,
        };
      case "land":
        return {
          eyeTargetScale: [1.4, 0.5] as [number, number],
          eyeTargetLook: [0.02, -0.06] as [number, number],
          mood,
        };
      case "happy":
        return {
          eyeTargetScale: [1.15, 1.15] as [number, number],
          eyeTargetLook: [0, 0.05] as [number, number],
          mood,
        };
      case "curious":
        return {
          eyeTargetScale: [1.05, 1] as [number, number],
          eyeTargetLook: [0.08, 0] as [number, number],
          mood,
        };
      case "angry":
        return {
          eyeTargetScale: [1.1, 0.85] as [number, number],
          eyeTargetLook: [0, -0.02] as [number, number],
          mood,
        };
      case "sad":
        return {
          eyeTargetScale: [0.95, 0.9] as [number, number],
          eyeTargetLook: [0, -0.05] as [number, number],
          mood,
        };
      default:
        return {
          eyeTargetScale: [1, 1] as [number, number],
          eyeTargetLook: [0, 0] as [number, number],
          mood,
        };
    }
  }, [thought, personality]);

  // Material & learning pulse
  const materialRef = useRef<MeshStandardMaterial | null>(null);
  const lastLearningPulse = useRef(learningPulseSignal);
  const pulseStrength = useRef(0); // decays from 1 to 0

  // Hover eye-look offset computed from pointer
  const hoverLook = useRef<[number, number]>([0, 0]);
  const [hoverLookState, setHoverLookState] = useState<[number, number]>([
    0, 0,
  ]);

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

    // Detect learning pulse signal edges
    if (learningPulseSignal !== lastLearningPulse.current) {
      lastLearningPulse.current = learningPulseSignal;
      pulseStrength.current = 1;
    }

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

    // Idle breathing and confusion jitter overlays (visual-only, small)
    if (phase.current === "idle" && ref.current) {
      const vis = computeVisualTargets(
        thought,
        personality ?? "calm",
        selected,
        hovered
      );
      const breath = 1 + vis.breathAmp * Math.sin(t * 1.6);
      const jitter = vis.jitterAmp
        ? vis.jitterAmp * (Math.sin(t * 20 + (id.charCodeAt(0) % 10)) * 0.5)
        : 0;
      ref.current.scale.y *= breath;
      ref.current.scale.x *= 1 - jitter * 0.5;
      ref.current.scale.z *= 1 + jitter * 0.5;
    }

    // Apply learning pulse overlay to scale (uniform) and material emissive
    if (pulseStrength.current > 0.001 && ref.current) {
      const mult = 1 + 0.08 * pulseStrength.current;
      ref.current.scale.multiplyScalar(mult);
      // decay
      pulseStrength.current *= Math.exp(-delta * 6);
    } else if (pulseStrength.current <= 0.001) {
      pulseStrength.current = 0;
    }

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
    // Update material from visual targets each frame, including pulse emissive boost
    if (materialRef.current) {
      const vis = computeVisualTargets(
        thought,
        personality ?? "calm",
        selected,
        hovered
      );
      materialRef.current.color.set(vis.color);
      materialRef.current.emissive.set(
        new Color(vis.color).multiplyScalar(0.4)
      );
      const pulseEmissiveBoost = 0.4 * pulseStrength.current;
      materialRef.current.emissiveIntensity =
        vis.emissiveIntensity + pulseEmissiveBoost;
      materialRef.current.roughness = vis.roughness;
      materialRef.current.metalness = vis.metalness;
    }
  });

  useEffect(() => {
    let mounted = true;
    const ideas = [
      "hmm...", 
      "¿Salto?", 
      "qué bonito cubo", 
      "zig zag", 
      "***",
      "¡Weee!", // happy
      "me siento triste", // sad
      "grr... frustrado", // angry
      "esto es curioso...", // curious
    ];
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
        onPointerOut={() => {
          setHovered(false);
          hoverLook.current = [0, 0];
          setHoverLookState([0, 0]);
        }}
        onPointerMove={(e) => {
          const obj = ref.current;
          if (!obj) return;
          const worldQuat = obj.getWorldQuaternion(tmpQ.current);
          obj.getWorldScale(tmpScale.current);
          const hz = 0.5 * tmpScale.current.z + 0.001;
          const planePoint = obj.localToWorld(tmpV1.current.set(0, 0, hz));
          const forward = tmpV2.current
            .set(0, 0, 1)
            .applyQuaternion(worldQuat)
            .normalize();
          tmpPlane.current.setFromNormalAndCoplanarPoint(forward, planePoint);
          const hit = e.ray.intersectPlane(tmpPlane.current, tmpV3.current);
          if (hit) {
            const local = obj.worldToLocal(tmpV3.current.clone());
            const hx = Math.max(0.5 * tmpScale.current.x, 0.0001);
            const hy = Math.max(0.5 * tmpScale.current.y, 0.0001);
            // Normalize and apply smooth scaling for natural look range
            const lx = MathUtils.clamp(local.x / hx, -1, 1) * 0.08;
            const ly = MathUtils.clamp(local.y / hy, -1, 1) * 0.08;
            hoverLook.current = [lx, ly];
            setHoverLookState([lx, ly]);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
      >
        <boxGeometry />
        <meshStandardMaterial
          ref={materialRef}
          color="#888888"
          emissiveIntensity={0.1}
          roughness={0.6}
          metalness={0.1}
        />

        {/* Eyes on +Z face */}
        {(() => {
          // Combine mood-based look with hover look when hovered
          const finalLook: [number, number] = [
            eyeTargetLook[0] + (hovered ? hoverLookState[0] : 0),
            eyeTargetLook[1] + (hovered ? hoverLookState[1] : 0),
          ];
          // Clamp combined look to a safe cute range (more generous)
          finalLook[0] = MathUtils.clamp(finalLook[0], -0.1, 0.1);
          finalLook[1] = MathUtils.clamp(finalLook[1], -0.1, 0.1);
          return eyeStyle === "bubble" ? (
            <BubbleEyes
              position={[0, 0.12, 0.51]}
              look={finalLook}
              eyeScale={eyeTargetScale}
              mood={mood}
            />
          ) : (
            <DotEyes
              position={[0, 0.12, 0.51]}
              look={finalLook}
              eyeScale={eyeTargetScale}
              mood={mood}
            />
          );
        })()}

        <Html position={[0, 1.4, 0]} occlude={true} transform sprite>
          <div
            className={`thought-bubble ${selected ? "thought--selected" : hovered ? "thought--hovered" : "thought--default"}`}
          >
            <div className="thought-badge">{id}</div>
            <div className="thought-text">{thought}</div>
            {/* <div className="thought-tail" /> */}
          </div>
        </Html>
      </mesh>
    </Select>
  );
}
