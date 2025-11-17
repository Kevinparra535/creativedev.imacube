import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import type { Triplet } from "@react-three/cannon";
import "../ThoughtBubble.css";

export interface CubeProps {
  id: string;
  selected?: boolean;
  hopSignal?: number;
  auto?: boolean;
  onSelect?: (id: string) => void;
  position?: Triplet;
  [key: string]: unknown;
}

export default function Cube({ id, selected = false, hopSignal = 0, auto = true, onSelect, ...props }: CubeProps) {
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
  const lastPhase = useRef<"idle" | "squash" | "air" | "land" | "settle">("idle");

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

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (!auto) {
      if (selected && hopSignal !== lastHopSignal.current && phase.current === "idle") {
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
      api.applyImpulse([dir.current[0] * 1.2, 3.2, dir.current[1] * 1.2], [0, 0, 0]);
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
  });

  useEffect(() => {
    let mounted = true;
    const ideas = ["hmm...", "¿Salto?", "qué bonito cubo", "zig zag", "***"];
    const tick = () => {
      if (mounted && phase.current === "idle") setThought(ideas[Math.floor(Math.random() * ideas.length)]);
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
        <meshStandardMaterial color={selected ? "#00d8ff" : hovered ? "hotpink" : "orange"} />

        <Html position={[0, 1.4, 0]} occlude={false} transform sprite>
          <div className={`thought-bubble ${selected ? "thought--selected" : hovered ? "thought--hovered" : "thought--default"}`}>
            <div className="thought-badge">{id}</div>
            <div className="thought-text">{thought}</div>
            <div className="thought-tail" />
          </div>
        </Html>
      </mesh>
    </Select>
  );
}
