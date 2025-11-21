// POC simplificado: Planner reducido a lógica local (sin llamada a IA)
import type { Personality } from "../ui/components/CubeList";
import { updateCube } from "../systems/Community";
import type { BehaviorDecision } from "../systems/CognitionTypes";
import { updateCubeMemory } from "./CubeMemory.service";
// Removed world knowledge & full memory context usage for POC.

const DEFAULT_TTL_MS = 4000; // Más corto en POC

function randomExplorationTarget(): [number, number, number] {
  // Área sandbox aproximada (ajustar según escena real)
  const range = 35;
  return [
    (Math.random() - 0.5) * 2 * range,
    5 + Math.random() * 5, // altura moderada
    (Math.random() - 0.5) * 2 * range,
  ];
}

function basicDecision(cubeId: string, personality: Personality, userMessage?: string): BehaviorDecision {
  // Pequeños impulsos de curiosidad/social según personalidad para crecer lento
  const skillUpdates: Record<string, number> = {};
  if (personality === "curious") skillUpdates.curiosity = 0.01;
  else if (personality === "extrovert") skillUpdates.social = 0.01;
  else if (personality === "calm") skillUpdates.empathy = 0.008;
  else if (personality === "chaotic") skillUpdates.creativity = 0.012;
  else skillUpdates.logic = 0.008;

  // Ocasional salto visual
  const transient = Math.random() < 0.3 ? { jump: true } : undefined;

  // Objetivo aleatorio para moverse/explorar
  const targetPos = randomExplorationTarget();

  // Actualizar memoria mínima (solo skill updates y registro de observación)
  try {
    updateCubeMemory(cubeId, {
      skillUpdates,
      intent: "observation",
      messageText: userMessage ? userMessage : undefined,
      currentActivity: "explorando",
    });
  } catch {
    /* ignorar */
  }

  return {
    goal: "explore",
    intent: "wander",
    target: { type: "zone", position: targetPos },
    transient,
    learning: { skillUpdates },
    mood: "curious",
    personalityShift: "none",
    ttlMs: DEFAULT_TTL_MS,
  };
}

/**
 * Plan behavior in response to user message (REACTIVE mode)
 */
export async function planBehavior(
  cubeId: string,
  personality: Personality,
  lastUserMessage: string
): Promise<BehaviorDecision | null> {
  const decision = basicDecision(cubeId, personality, lastUserMessage);
  // Publicar en comunidad
  updateCube(cubeId, {
    behaviorState: { ...decision },
    transientAction: decision.transient
      ? { ...decision.transient, expiresAt: Date.now() + (decision.ttlMs || DEFAULT_TTL_MS) }
      : undefined,
  });
  return decision;
}

/**
 * Plan behavior autonomously without user input (AUTONOMOUS mode)
 */
export async function planBehaviorAutonomous(
  cubeId: string,
  personality: Personality,
  _internalContext: string
): Promise<BehaviorDecision | null> {
  const decision = basicDecision(cubeId, personality);
  updateCube(cubeId, {
    behaviorState: { ...decision },
    transientAction: decision.transient
      ? { ...decision.transient, expiresAt: Date.now() + (decision.ttlMs || DEFAULT_TTL_MS) }
      : undefined,
  });
  return decision;
}
