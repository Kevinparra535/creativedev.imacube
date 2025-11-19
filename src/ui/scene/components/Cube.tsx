import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import type { Triplet } from "@react-three/cannon";
import { Color, Euler, Quaternion, Vector3, Plane, MathUtils } from "three";
import type { MeshStandardMaterial, Mesh, PointLight } from "three";

import { BubbleEyes, DotEyes } from "../objects";
import { computeVisualTargets } from "../visual/visualState";
import type { Personality } from "../visual/visualState";
import {
  scanForTargets,
  isBoredOf,
  recordVisit,
  createAttentionState,
} from "../systems/AttentionSystem";
import {
  computeJumpDirection,
  getJumpStrength,
  getJumpInterval,
  computeTargetOrientation,
  slerpToTarget,
  hasArrivedAt,
  createNavigationState,
  startNavigation,
  stopNavigation,
} from "../systems/NavigationSystem";
import {
  registerCube,
  unregisterCube,
  updateCube,
  getNeighbors,
  getCube,
} from "../systems/Community";
import {
  tryLearnFromNeighbors,
  spontaneousDiscovery,
} from "../systems/SocialLearningSystem";
import {
  applyBookEffects,
  createKnowledgeState,
} from "../guidelines/instrucciones";
import type { KnowledgeDomain, BookSpec } from "../guidelines/instrucciones";
import {
  decideTORead,
  getReadingSpeed,
  processEmotions,
  checkPersonalityChange,
  applyKnowledgeGains,
  getCategoryThought,
  createReadingState,
  startReading,
  finishReading,
  type ReadingState,
} from "../systems/BookReadingSystem";
import type { BookContent } from "../data/booksLibrary";
import type { Personality as ListPersonality } from "../../components/CubeList";

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
  bookTargets?: Array<{
    object: Mesh;
    type: "book";
    domain?: string;
    difficulty?: "basic" | "intermediate" | "advanced";
  }>; // Available books for attention system
  mirrorPosition?: [number, number, number]; // Mirror position for self-recognition
  allCubeIds?: string[]; // All cube IDs for social exploration
  ambientZones?: Array<{
    position: [number, number, number];
    type: "ice" | "lava";
  }>; // Ambient exploration zones
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
  bookTargets = [],
  mirrorPosition,
  allCubeIds = [],
  ambientZones = [],
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
  const [mirrorRecognitionPhase, setMirrorRecognitionPhase] = useState<
    "none" | "noticing" | "curious" | "recognized" | "reflecting"
  >("none");
  const mirrorRecognitionStart = useRef(0);
  const hasRecognizedSelf = useRef(false);
  const lastMirrorCheck = useRef(0);
  const [thought, setThought] = useState<string>("...");

  type CubePhase =
    | "idle"
    | "squash"
    | "air"
    | "land"
    | "settle"
    | "scanning"
    | "interested"
    | "navigating"
    | "observing";
  const phase = useRef<CubePhase>("idle");
  const phaseStart = useRef(0);
  const nextHopAt = useRef(0);
  const dir = useRef<[number, number]>([0, 0]);
  const targetScale = useRef<[number, number, number]>([1, 1, 1]);
  const scaleNow = useRef<[number, number, number]>([1, 1, 1]);
  const yPos = useRef(0);
  const velY = useRef(0);
  const lastHopSignal = useRef(0);
  const lastPhase = useRef<CubePhase>("idle");

  // Attention & Navigation state
  const attentionState = useRef(createAttentionState());
  const navigationState = useRef(createNavigationState());
  const lastScanTime = useRef(0);
  const [scanInterval] = useState(() => 3 + Math.random() * 4); // Random scan interval per cube (React 19 purity)
  const cubePos = useRef<[number, number, number]>([0, 0, 0]);
  const cubeVel = useRef<[number, number, number]>([0, 0, 0]);
  const isNavigating = useRef(false); // Track if actively navigating

  const learningProgress = useRef({ navigation: 0, selfRighting: 0 });
  const observedBookMeta = useRef<{
    domain?: string;
    difficulty?: "basic" | "intermediate" | "advanced";
  } | null>(null);
  const observeTick = useRef(0);
  const tiltExperienceTick = useRef(0);
  const readingState = useRef<ReadingState>(createReadingState());
  const readingTick = useRef(0);
  const [currentPersonality, setCurrentPersonality] = useState(
    personality || "neutral"
  );
  const originalPersonality = useRef(personality || "neutral");
  const emotionsExperienced = useRef<Set<string>>(new Set());
  const traitsAcquired = useRef<Set<string>>(new Set());
  const booksRead = useRef<string[]>([]);
  const conceptsLearned = useRef<Set<string>>(new Set());
  const selLightRef = useRef<PointLight | null>(null);
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

  // Navigation jump animation overlay (keeps main phase as 'navigating')
  const navJumpPhase = useRef<"idle" | "squash" | "air" | "land" | "settle">(
    "idle"
  );
  const navJumpStart = useRef(0);

  // Social learning & capabilities
  const [socialTrait] = useState<"kind" | "selfish">(() =>
    Math.random() < 0.6 ? "kind" : "selfish"
  );
  const capabilities = useRef({ selfRighting: false, navigation: false });
  const lastLearnCheck = useRef(0);
  const knowledge = useRef(createKnowledgeState());
  const personalityForRegistry: ListPersonality =
    personality as ListPersonality;

  // Eyes targets derived from thought and current personality (may have changed from reading)
  const { eyeTargetScale, eyeTargetLook, mood } = useMemo(() => {
    const txt = (thought || "").toLowerCase();
    let mood:
      | "neutral"
      | "prep"
      | "air"
      | "land"
      | "curious"
      | "happy"
      | "angry"
      | "sad" = "neutral";

    // Priority 1: Physical jump phases (temporary emotional states)
    if (txt.includes("preparando")) mood = "prep";
    else if (txt.includes("weee") || txt.includes("!")) mood = "happy";
    else if (txt.includes("plof")) mood = "land";
    // Priority 2: Navigation/cognitive states
    else if (
      txt.includes("qué hay") ||
      txt.includes("¿") ||
      txt.includes("?") ||
      txt.includes("déjame ver") ||
      txt.includes("interesante")
    )
      mood = "curious";
    else if (
      txt.includes("se ve interesante") ||
      txt.includes("voy hacia") ||
      txt.includes("allá")
    )
      mood = "happy";
    // Priority 3: Emotional keywords
    else if (txt.includes("triste") || txt.includes("😢")) mood = "sad";
    else if (
      txt.includes("enojado") ||
      txt.includes("grr") ||
      txt.includes("frustrado")
    )
      mood = "angry";
    else if (
      txt.includes("hmm") ||
      txt.includes("zig") ||
      txt.includes("bonito")
    )
      mood = "curious";
    // Priority 4: Personality baseline
    else {
      if (currentPersonality === "extrovert") mood = "happy";
      else if (currentPersonality === "chaotic") mood = "angry";
      else if (currentPersonality === "curious") mood = "curious";
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
  }, [thought, currentPersonality]);

  // Material & learning pulse
  const materialRef = useRef<MeshStandardMaterial | null>(null);
  const lastLearningPulse = useRef(learningPulseSignal);
  const pulseStrength = useRef(0); // decays from 1 to 0

  // Hover eye-look offset computed from pointer
  const hoverLook = useRef<[number, number]>([0, 0]);
  const [hoverLookState, setHoverLookState] = useState<[number, number]>([
    0, 0,
  ]);

  // Track position and velocity
  useEffect(() => {
    const unsubPos = api.position.subscribe(([x, y, z]) => {
      yPos.current = y;
      cubePos.current = [x, y, z];
    });
    const unsubVel = api.velocity.subscribe(([vx, vy, vz]) => {
      velY.current = vy;
      cubeVel.current = [vx, vy, vz];
    });
    return () => {
      unsubPos();
      unsubVel();
    };
  }, [api.position, api.velocity]);

  // Initialize early first scan so they start choosing targets quickly
  useEffect(() => {
    lastScanTime.current = -scanInterval + 0.5;
  }, [scanInterval]);

  // Subscribe to quaternion to track current orientation
  useEffect(() => {
    const unsubQuat = api.quaternion.subscribe(([x, y, z, w]) => {
      quatRef.current = [x, y, z, w];
    });
    return () => {
      unsubQuat();
    };
  }, [api.quaternion]);

  // Register cube in community on mount and unregister on unmount
  useEffect(() => {
    registerCube({
      id,
      position: cubePos.current,
      personality: personalityForRegistry,
      socialTrait,
      capabilities: capabilities.current,
    });
    return () => {
      unregisterCube(id);
    };
  }, [id, personality, personalityForRegistry, socialTrait]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Detect learning pulse signal edges
    if (learningPulseSignal !== lastLearningPulse.current) {
      lastLearningPulse.current = learningPulseSignal;
      pulseStrength.current = 1;
    }

    // ────────────────────────────────────────────────────────────────
    // COMMUNITY UPDATE & SOCIAL LEARNING TICK
    // ────────────────────────────────────────────────────────────────
    // Keep public state updated (include learning progress, current personality, and reading experiences)
    updateCube(id, {
      position: cubePos.current,
      personality: currentPersonality as
        | "calm"
        | "curious"
        | "extrovert"
        | "chaotic"
        | "neutral",
      capabilities: capabilities.current,
      learningProgress: { ...learningProgress.current },
      knowledge: { ...knowledge.current },
      readingExperiences: {
        originalPersonality: originalPersonality.current,
        emotionsExperienced: Array.from(emotionsExperienced.current),
        traitsAcquired: Array.from(traitsAcquired.current),
        booksRead: [...booksRead.current],
        currentBook: readingState.current.currentBook?.titulo,
        readingProgress: readingState.current.readingProgress,
        conceptsLearned: Array.from(conceptsLearned.current),
      },
    });
    // Periodically attempt to learn missing capabilities
    if (t - lastLearnCheck.current > 2) {
      lastLearnCheck.current = t;
      const needs: Array<keyof typeof capabilities.current> = [];
      if (!capabilities.current.navigation) needs.push("navigation");
      if (!capabilities.current.selfRighting) needs.push("selfRighting");
      if (needs.length) {
        // Try spontaneous discovery first
        let discovered = false;
        for (const need of needs) {
          if (spontaneousDiscovery(personalityForRegistry, need)) {
            (capabilities.current as typeof capabilities.current)[need] = true;
            discovered = true;
            setThought(
              need === "navigation"
                ? "¡Creo que aprendí a moverme!"
                : "¡Puedo enderezarme solo!"
            );
            pulseStrength.current = 1;
          }
        }
        if (!discovered) {
          const neighbors = getNeighbors(id, cubePos.current, 6);
          const outcome = tryLearnFromNeighbors(
            {
              id,
              position: cubePos.current,
              personality: personalityForRegistry,
              socialTrait,
              capabilities: capabilities.current,
            },
            neighbors,
            needs
          );
          if (outcome && outcome.learned) {
            Object.assign(capabilities.current, outcome.learned);
            setThought(
              outcome.taughtBy
                ? `¡Gracias ${outcome.taughtBy}, aprendí algo nuevo!`
                : "¡Aprendí algo nuevo!"
            );
            pulseStrength.current = 1;
          }
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    // LOCAL STEERING: SEPARATION + BOUNDS AVOIDANCE (reduces clumping)
    // ────────────────────────────────────────────────────────────────
    {
      // Personality-based separation strength
      const sepBase = currentPersonality === "extrovert" ? 6 : currentPersonality === "chaotic" ? 9 : 8;
      const desiredSeparation = 4.5; // meters
      const neighbors = getNeighbors(id, cubePos.current, desiredSeparation + 2);
      let repelX = 0;
      let repelZ = 0;
      for (const nb of neighbors) {
        const dx = cubePos.current[0] - nb.position[0];
        const dz = cubePos.current[2] - nb.position[2];
        const d2 = dx * dx + dz * dz;
        if (d2 > 0.0001) {
          // Inverse-square falloff to push stronger when too close
          const inv = 1 / d2;
          repelX += dx * inv;
          repelZ += dz * inv;
        }
      }
      // Wall avoidance toward sandbox center when near walls (|x|,|z| ~ 50)
      const bound = 46; // start steering back before actual wall at ~50
      const bx = cubePos.current[0];
      const bz = cubePos.current[2];
      if (Math.abs(bx) > bound) repelX += bx > 0 ? -0.5 : 0.5;
      if (Math.abs(bz) > bound) repelZ += bz > 0 ? -0.5 : 0.5;

      const mag = Math.hypot(repelX, repelZ);
      if (mag > 0.0001) {
        // Normalize and scale by separation strength and delta to be frame-rate independent
        const nx = (repelX / mag) * sepBase;
        const nz = (repelZ / mag) * sepBase;
        // Apply a gentle continuous force at center of mass
        api.applyForce([nx * delta, 0, nz * delta], [0, 0, 0]);
      }
    }

    // ────────────────────────────────────────────────────────────────
    // MIRROR SELF-RECOGNITION SYSTEM
    // ────────────────────────────────────────────────────────────────
    if (mirrorPosition && t - lastMirrorCheck.current > 0.5) {
      lastMirrorCheck.current = t;
      const [mx, my, mz] = mirrorPosition;
      const dx = cubePos.current[0] - mx;
      const dy = cubePos.current[1] - my;
      const dz = cubePos.current[2] - mz;
      const distToMirror = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Progressive recognition phases based on proximity
      if (distToMirror < 3.5 && mirrorRecognitionPhase === "none") {
        // Phase 1: Noticing reflection
        setMirrorRecognitionPhase("noticing");
        mirrorRecognitionStart.current = t;
        setThought("¿Qué es eso?");
      } else if (
        distToMirror < 2.5 &&
        mirrorRecognitionPhase === "noticing" &&
        t - mirrorRecognitionStart.current > 2
      ) {
        // Phase 2: Getting curious
        setMirrorRecognitionPhase("curious");
        mirrorRecognitionStart.current = t;
        const curiousThoughts = [
          "Hmm... se mueve como yo",
          "¿Me está imitando?",
          "Ese cubo parece familiar...",
        ];
        setThought(
          curiousThoughts[Math.floor(Math.random() * curiousThoughts.length)]
        );
      } else if (
        distToMirror < 1.8 &&
        mirrorRecognitionPhase === "curious" &&
        t - mirrorRecognitionStart.current > 3 &&
        !hasRecognizedSelf.current
      ) {
        // Phase 3: Self-recognition moment!
        setMirrorRecognitionPhase("recognized");
        mirrorRecognitionStart.current = t;
        hasRecognizedSelf.current = true;

        // Personality-based reactions
        const recognitionThoughts: Record<string, string> = {
          extrovert: "¡Soy yo! ¡Me veo genial!",
          calm: "Ah... ese soy yo. Interesante perspectiva.",
          curious: "¡Fascinante! Ese es mi reflejo. ¿Qué revela de mí?",
          chaotic: "¿¿ESE SOY YO?! ¡Increíble!",
          neutral: "Reconocimiento: ese es mi aspecto físico.",
        };
        setThought(
          recognitionThoughts[currentPersonality] ||
            "¡Ese soy yo! Cogito ergo sum."
        );

        // Knowledge gain: self-awareness
        knowledge.current.self_awareness += 1;
        emotionsExperienced.current.add("wonder");
        traitsAcquired.current.add("self_conscious");

        // Pulse effect on recognition
        pulseStrength.current = Math.max(pulseStrength.current, 1.2);

        // Update community with self-awareness achievement
        updateCube(id, {
          position: cubePos.current,
          personality: personalityForRegistry,
          readingExperiences: {
            originalPersonality: originalPersonality.current,
            booksRead: booksRead.current,
            emotionsExperienced: Array.from(emotionsExperienced.current),
            traitsAcquired: Array.from(traitsAcquired.current),
            conceptsLearned: Array.from(conceptsLearned.current),
          },
          capabilities: capabilities.current,
        });
      } else if (
        distToMirror < 1.5 &&
        mirrorRecognitionPhase === "recognized" &&
        t - mirrorRecognitionStart.current > 4
      ) {
        // Phase 4: Philosophical reflection
        setMirrorRecognitionPhase("reflecting");
        mirrorRecognitionStart.current = t;
        const philosophicalThoughts: Record<string, string> = {
          extrovert: "Me pregunto qué piensan los demás de mí...",
          calm: "El reflejo muestra el exterior, no el interior.",
          curious:
            "Si puedo verme, ¿qué más puedo descubrir sobre mí mismo?",
          chaotic: "¿Soy realmente así? ¡Necesito cambiar!",
          neutral: "Observación: la auto-percepción afecta la identidad.",
        };
        setThought(
          philosophicalThoughts[currentPersonality] ||
            "¿Quién soy realmente más allá de mi reflejo?"
        );
      } else if (distToMirror > 4 && mirrorRecognitionPhase !== "none") {
        // Left mirror area - reset to allow re-observation
        if (mirrorRecognitionPhase !== "recognized") {
          setMirrorRecognitionPhase("none");
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    // ATTENTION & NAVIGATION SYSTEM (only in auto mode)
    // ────────────────────────────────────────────────────────────────
    if (auto) {
      const att = attentionState.current;
      const nav = navigationState.current;

      // SCANNING: Periodic scan for interesting targets
      // Allow scanning whenever not actively navigating to find goals sooner
      if (!isNavigating.current && t - lastScanTime.current > scanInterval) {
        lastScanTime.current = t;

        // Build complete exploration targets list
        const explorationTargets: Array<{
          object: any;
          type: "book" | "cube" | "zone" | "ambient";
          domain?: string;
          difficulty?: "basic" | "intermediate" | "advanced";
        }> = [];

        // Add book targets
        explorationTargets.push(...bookTargets);

        // Add other cubes as social targets only if sufficiently far (avoid clustering)
        allCubeIds.forEach((cubeId) => {
          if (cubeId !== id) {
            const otherCube = getCube(cubeId);
            if (otherCube && otherCube.position) {
              const dx = otherCube.position[0] - cubePos.current[0];
              const dz = otherCube.position[2] - cubePos.current[2];
              const dist = Math.hypot(dx, dz);
              if (dist > 10) {
                explorationTargets.push({
                  object: {
                    position: {
                      x: otherCube.position[0],
                      y: otherCube.position[1],
                      z: otherCube.position[2],
                    },
                  },
                  type: "cube",
                });
              }
            }
          }
        });

        // Add mirror as exploration target
        if (mirrorPosition) {
          explorationTargets.push({
            object: {
              position: {
                x: mirrorPosition[0],
                y: mirrorPosition[1],
                z: mirrorPosition[2],
              },
            },
            type: "zone",
          });
        }

        // Add ambient zones
        ambientZones.forEach((zone) => {
          explorationTargets.push({
            object: {
              position: {
                x: zone.position[0],
                y: zone.position[1],
                z: zone.position[2],
              },
            },
            type: "ambient",
          });
        });

        // Add random exploration points (curiosity-driven wandering)
        if (Math.random() < 0.3) {
          // 30% chance to add a random point
          const randomX = (Math.random() - 0.5) * 80; // Within sandbox bounds
          const randomZ = (Math.random() - 0.5) * 80;
          explorationTargets.push({
            object: {
              position: { x: randomX, y: 0.5, z: randomZ },
            },
            type: "zone",
          });
        }

        const target = scanForTargets(
          cubePos.current,
          personality,
          att.targetHistory,
          explorationTargets
        );

        if (target && !att.currentTarget) {
          // Found something interesting!
          att.currentTarget = target;
          att.interestTimer = 0;
          phase.current = "interested";
          phaseStart.current = t;
        }
      }

      // INTERESTED: Decided to navigate toward target
      if (phase.current === "interested" && att.currentTarget) {
        if (capabilities.current.navigation) {
          // Start navigation
          Object.assign(nav, startNavigation(att.currentTarget.position));
          phase.current = "navigating";
          isNavigating.current = true;
          phaseStart.current = t;

          // Set thought based on target type
          if (att.currentTarget.type === "cube") {
            const socialThoughts = [
              "¿Qué hay por allá?",
              "Voy a ver a ese cubo",
              "¡Hola! Voy hacia ti",
              "Me pregunto qué hace...",
            ];
            setThought(
              socialThoughts[Math.floor(Math.random() * socialThoughts.length)]
            );
          } else if (att.currentTarget.type === "zone") {
            setThought("Hmm, esa zona parece interesante");
          } else if (att.currentTarget.type === "ambient") {
            setThought("¿Qué habrá allí?");
          }
        } else {
          // Can't navigate yet — observe briefly and try to learn
          setThought("Quiero moverme... ¿alguien me enseña?");
          phase.current = "observing";
          phaseStart.current = t;
          attentionState.current.interestTimer = 0;
        }
      }

      // NAVIGATING: Moving toward target
      if (phase.current === "navigating" && nav.targetPosition) {
        // Check if arrived
        if (
          hasArrivedAt(cubePos.current, nav.targetPosition, cubeVel.current)
        ) {
          // Arrived! Switch to observing
          phase.current = "observing";
          isNavigating.current = false;
          phaseStart.current = t;
          att.interestTimer = 0;

          // Record visit in memory
          if (att.currentTarget) {
            att.targetHistory = recordVisit(
              att.targetHistory,
              att.currentTarget
            );
          }

          // Begin observing book metadata for vision-based learning
          if (att.currentTarget && att.currentTarget.type === "book") {
            observedBookMeta.current = {
              domain: att.currentTarget.domain,
              difficulty: att.currentTarget.difficulty,
            };
            pulseStrength.current = 0.6; // small arrival pulse

            // Check if book has full content and decide whether to read
            const bookContent = att.currentTarget.object.userData
              .bookContent as BookContent | undefined;
            if (bookContent) {
              const wantsToRead = decideTORead(
                bookContent,
                currentPersonality as
                  | "calm"
                  | "curious"
                  | "extrovert"
                  | "chaotic"
                  | "neutral"
              );
              if (wantsToRead) {
                readingState.current = startReading(bookContent, t);
                setThought(`"${bookContent.titulo}"... interesante`);
              } else {
                // Rejected book
                setThought("Mmm, no me llama la atención");
                readingState.current = createReadingState();
              }
            }
          }
        } else {
          // Continue navigating: orient and jump periodically
          const timeSinceLastJump = t - nav.lastJumpAt;
          const jumpInterval = getJumpInterval(
            currentPersonality as Personality
          );

          if (
            capabilities.current.navigation &&
            timeSinceLastJump > jumpInterval &&
            phase.current === "navigating"
          ) {
            // Compute direction toward target
            const [dx, , dz] = computeJumpDirection(
              cubePos.current,
              nav.targetPosition,
              currentPersonality as Personality
            );

            if (dx !== 0 || dz !== 0) {
              // Apply jump impulse
              const jumpStrength = getJumpStrength(
                currentPersonality as Personality
              );
              api.applyImpulse([dx, jumpStrength, dz], [0, 0, 0]);
              nav.lastJumpAt = t;
              // Trigger jump animation overlay without leaving navigating
              navJumpPhase.current = "squash";
              navJumpStart.current = t;
              targetScale.current = [1.25, 0.75, 1.25];
            }
          }

          // Orient toward target if can navigate
          if (capabilities.current.navigation) {
            const targetQuat = computeTargetOrientation(
              cubePos.current,
              nav.targetPosition
            );
            const currentQuat = tmpQ.current.set(
              quatRef.current[0],
              quatRef.current[1],
              quatRef.current[2],
              quatRef.current[3]
            );
            const newQuat = slerpToTarget(currentQuat, targetQuat, 0.1);
            api.quaternion.set(newQuat.x, newQuat.y, newQuat.z, newQuat.w);
          }
        }
      }

      // Progress navigation jump animation overlay
      if (phase.current === "navigating" && navJumpPhase.current !== "idle") {
        const elapsed = t - navJumpStart.current;
        if (navJumpPhase.current === "squash" && elapsed > 0.18) {
          navJumpPhase.current = "air";
          navJumpStart.current = t;
          targetScale.current = [0.9, 1.1, 0.9];
        } else if (navJumpPhase.current === "air") {
          if (yPos.current <= 0.52 && velY.current < -0.2) {
            navJumpPhase.current = "land";
            navJumpStart.current = t;
            targetScale.current = [1.3, 0.7, 1.3];
          }
        } else if (navJumpPhase.current === "land" && elapsed > 0.12) {
          navJumpPhase.current = "settle";
          navJumpStart.current = t;
          targetScale.current = [1, 1, 1];
        } else if (navJumpPhase.current === "settle" && elapsed > 0.08) {
          navJumpPhase.current = "idle";
        }
      }

      // OBSERVING: At target, gradual learning + boredom check
      if (phase.current === "observing" && att.currentTarget) {
        att.interestTimer += delta;
        // Reading system: process emotions and knowledge from book content
        if (
          att.currentTarget.type === "book" &&
          readingState.current.currentBook
        ) {
          readingTick.current += delta;
          if (readingTick.current >= 1) {
            readingTick.current = 0;
            const book = readingState.current.currentBook;
            const readSpeed = getReadingSpeed(
              currentPersonality as
                | "calm"
                | "curious"
                | "extrovert"
                | "chaotic"
                | "neutral",
              book.dificultad
            );

            // Update reading progress
            readingState.current.readingProgress += readSpeed;

            // Process emotions every second while reading
            const { emotion, thought } = processEmotions(
              book,
              readingState.current.readingProgress,
              currentPersonality as
                | "calm"
                | "curious"
                | "extrovert"
                | "chaotic"
                | "neutral"
            );
            setThought(thought);

            // Track emotion experienced
            emotionsExperienced.current.add(emotion);

            // Progressively add key concepts from the book as knowledge topics
            const conceptos = book.propiedades.conceptos;
            if (conceptos && conceptos.length > 0) {
              const idx = Math.floor(
                Math.min(0.999, readingState.current.readingProgress) *
                  conceptos.length
              );
              for (let i = 0; i <= idx; i++) {
                const c = conceptos[i];
                if (c) conceptsLearned.current.add(c);
              }
            }

            // Small pulse on strong emotions
            if (
              ["Miedo", "Ira", "Asco", "Fascinación", "Alegría"].includes(
                emotion
              )
            ) {
              pulseStrength.current = 0.4;
            }

            // Apply knowledge gains progressively
            const knowledgeGains = applyKnowledgeGains(
              knowledge.current as unknown as Record<string, number>,
              book,
              readSpeed
            );
            Object.keys(knowledgeGains).forEach((key) => {
              if (key in knowledge.current) {
                // merge chunked gains into structured knowledge state
                knowledge.current = {
                  ...knowledge.current,
                  [key]: knowledgeGains[key],
                } as typeof knowledge.current;
              }
            });

            // Capability progress: navigation from relevant domains
            const relevantDomains = ["Ciencia", "Física", "Biología"];
            const hasRelevant = book.propiedades.conocimientos.some((k) =>
              relevantDomains.includes(k)
            );
            if (!capabilities.current.navigation && hasRelevant) {
              const navRate = readSpeed * 0.3;
              learningProgress.current.navigation = Math.min(
                1,
                learningProgress.current.navigation + navRate
              );
              if (learningProgress.current.navigation >= 1) {
                capabilities.current.navigation = true;
                setThought("¡Ahora entiendo cómo moverme!");
                pulseStrength.current = 1;
              }
            }

            // Check if finished reading
            if (readingState.current.readingProgress >= 1) {
              // Track traits acquired from this book
              book.propiedades.traits_ganados.forEach((trait) => {
                traitsAcquired.current.add(trait);
              });

              // Track book read
              if (!booksRead.current.includes(book.titulo)) {
                booksRead.current.push(book.titulo);
              }

              // Ensure all concepts recorded at completion
              const conceptosAll = book.propiedades.conceptos;
              if (conceptosAll && conceptosAll.length) {
                conceptosAll.forEach((c) => conceptsLearned.current.add(c));
              }

              // Book finished! Check for personality change
              const changeResult = checkPersonalityChange(
                book,
                currentPersonality as
                  | "calm"
                  | "curious"
                  | "extrovert"
                  | "chaotic"
                  | "neutral"
              );
              if (changeResult.shouldChange && changeResult.newPersonality) {
                setCurrentPersonality(changeResult.newPersonality);
                setThought(changeResult.reason || "Me siento... diferente");
                pulseStrength.current = 1.2;
              } else {
                setThought(getCategoryThought(book.categoria));
                pulseStrength.current = 0.8;
              }

              // Clear reading state + brief visual flash via pulse/point light
              // Mark a stronger pulse; the point light will reflect it
              pulseStrength.current = Math.max(pulseStrength.current, 1);
              readingState.current = finishReading();
            }
          }
        } else if (
          att.currentTarget.type === "book" &&
          !readingState.current.currentBook
        ) {
          // Just observing without reading (rejected or no content)
          observeTick.current += delta;
          if (observeTick.current >= 1) {
            observeTick.current = 0;
            const domain = observedBookMeta.current?.domain as
              | KnowledgeDomain
              | undefined;
            const difficulty = observedBookMeta.current?.difficulty;
            const baseGain =
              difficulty === "advanced"
                ? 0.08
                : difficulty === "intermediate"
                  ? 0.06
                  : 0.04;
            const personalityMultiplier =
              currentPersonality === "curious"
                ? 1.15
                : currentPersonality === "extrovert"
                  ? 0.9
                  : currentPersonality === "calm"
                    ? 0.65
                    : currentPersonality === "chaotic"
                      ? 0.8
                      : 0.85;
            const stepGain = baseGain * personalityMultiplier;
            if (domain) {
              const bookStep: BookSpec = {
                domain,
                affect: { emotion: "curious", knowledgeGain: stepGain },
              } as BookSpec;
              const res = applyBookEffects(
                knowledge.current,
                bookStep,
                personalityForRegistry
              );
              knowledge.current = res.knowledge;
            }
          }
        }

        if (isBoredOf(att.currentTarget, personality, att.interestTimer)) {
          // Bored! Reset to idle and look for something else
          att.currentTarget = null;
          Object.assign(nav, stopNavigation());
          phase.current = "idle";
          phaseStart.current = t;
          nextHopAt.current = t + 1; // Small delay before next scan
          isNavigating.current = false;
          observedBookMeta.current = null;
          observeTick.current = 0;
          readingState.current = finishReading();
          readingTick.current = 0;
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    // MANUAL/AUTO HOP SYSTEM (original behavior)
    // ────────────────────────────────────────────────────────────────
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
        currentPersonality as Personality,
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

      // Confusion wobble: subtle opposing X/Z oscillation when confused
      const text = (thought || "").toLowerCase();
      const confused =
        text.includes("confusión") ||
        text.includes("no entiendo") ||
        text.includes("¿") ||
        text.includes("?");
      if (confused) {
        const wobbleAmp = 0.03;
        const wobble = Math.sin(t * 6 + (id.charCodeAt(0) % 11)) * wobbleAmp;
        ref.current.scale.x *= 1 + wobble;
        ref.current.scale.z *= 1 - wobble;
      }
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
        case "scanning":
          setThought("¿Qué hay por aquí?");
          break;
        case "interested":
          setThought("¡Eso se ve interesante!");
          break;
        case "navigating":
          setThought("¡Voy hacia allá!");
          break;
        case "observing":
          setThought("Déjame ver...");
          break;
        default:
          setThought("...");
      }
    }

    // Self-righting: learn by experiencing tilt, then apply when learned
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

    // Learn self-righting by experiencing tilt (even before capability unlocked)
    if (!capabilities.current.selfRighting && tilt > 0.5) {
      tiltExperienceTick.current += delta;
      if (tiltExperienceTick.current >= 1) {
        tiltExperienceTick.current = 0;
        // Progress faster for curious/extrovert, slower for calm
        const experienceRate =
          currentPersonality === "curious"
            ? 0.06
            : currentPersonality === "extrovert"
              ? 0.05
              : currentPersonality === "neutral"
                ? 0.04
                : currentPersonality === "calm"
                  ? 0.025
                  : 0.035;
        learningProgress.current.selfRighting = Math.min(
          1,
          learningProgress.current.selfRighting + experienceRate
        );
        if (learningProgress.current.selfRighting >= 1) {
          capabilities.current.selfRighting = true;
          setThought("¡Aprendí a enderezarme solo!");
          pulseStrength.current = 1;
        }
      }
    }

    if (capabilities.current.selfRighting) {
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
    }
    // Face mirror during recognition phases (higher priority than camera)
    if (
      mirrorPosition &&
      (mirrorRecognitionPhase === "curious" ||
        mirrorRecognitionPhase === "recognized" ||
        mirrorRecognitionPhase === "reflecting") &&
      ref.current
    ) {
      const [mx, , mz] = mirrorPosition;
      const dx = mx - cubePos.current[0];
      const dz = mz - cubePos.current[2];
      const desiredYaw = Math.atan2(dx, dz);

      tmpEuler.current.set(0, 0, 0);
      tmpQ.current.setFromEuler(tmpEuler.current);
      tmpEuler.current.y = desiredYaw;
      const desired = new Quaternion().setFromEuler(tmpEuler.current);

      const qNow = ref.current.quaternion;
      qNow.slerp(desired, Math.min(1, 5 * delta)); // Faster turn toward mirror
    }
    // Face the camera gently when selected and idle-ish
    else if (
      selected &&
      !isNavigating.current &&
      (phase.current === "idle" ||
        phase.current === "settle" ||
        phase.current === "observing")
    ) {
      const cam = state.camera.position;
      const [cx, , cz] = cubePos.current;
      const dx = cam.x - cx;
      const dz = cam.z - cz;
      const yaw = Math.atan2(dx, dz);
      const desired = new Quaternion().setFromEuler(
        new Euler(0, yaw, 0, "YXZ")
      );
      const qNow = tmpQ.current.set(
        quatRef.current[0],
        quatRef.current[1],
        quatRef.current[2],
        quatRef.current[3]
      );
      qNow.slerp(desired, Math.min(1, 4 * delta));
      api.quaternion.set(qNow.x, qNow.y, qNow.z, qNow.w);
    }

    // Update material from visual targets each frame, including pulse emissive boost
    if (materialRef.current) {
      const vis = computeVisualTargets(
        thought,
        currentPersonality as Personality,
        selected,
        hovered
      );
      materialRef.current.color.set(vis.color);
      materialRef.current.emissive.set(
        new Color(vis.color).multiplyScalar(0.4)
      );
      const pulseEmissiveBoost = 0.4 * pulseStrength.current;
      let emi = vis.emissiveIntensity + pulseEmissiveBoost;
      if (currentPersonality === "chaotic") {
        const flick =
          0.06 * (0.5 + 0.5 * Math.sin(t * 18 + (id.charCodeAt(0) % 7)));
        emi += flick;
      }
      materialRef.current.emissiveIntensity = emi;
      materialRef.current.roughness = vis.roughness;
      materialRef.current.metalness = vis.metalness;
    }

    // Update selected point light intensity from pulse
    if (selLightRef.current) {
      selLightRef.current.intensity = selected
        ? 0.6 + 1.6 * pulseStrength.current
        : 0;
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

        {selected ? (
          <pointLight
            ref={selLightRef}
            position={[0, 1.2, 0]}
            color="#ffd166"
            distance={14}
            decay={2}
            intensity={0}
          />
        ) : null}

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
