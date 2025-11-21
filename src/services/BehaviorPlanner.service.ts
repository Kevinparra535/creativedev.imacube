import type { Personality } from "../ui/components/CubeList";
import { buildWorldKnowledgeContext } from "../data/worldKnowledge";
import { getCube, updateCube } from "../systems/Community";
import type { BehaviorDecision } from "../systems/CognitionTypes";
import { getCubeMemory, buildMemoryContext, updateCubeMemory } from "./CubeMemory.service";

interface PlannerConfig {
  localUrl: string;
  fallbackModel: string;
}

const DEFAULT_TTL_MS = 6000;

function getPlannerConfig(): PlannerConfig {
  const localUrl = import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:3001/api/chat";
  const fallbackModel = import.meta.env.VITE_LOCAL_AI_MODEL || "llama3.1";
  return { localUrl, fallbackModel };
}

function buildPlannerSystemPrompt(personality: Personality): string {
  return `Eres el PLANNER de comportamiento de un NPC en un sandbox 3D. Tu tarea es devolver únicamente JSON estrictamente válido que describa la decisión del NPC para los próximos segundos.

Reglas:
- Devuelve SOLO JSON, sin texto adicional.
- El JSON debe cumplir con este esquema mínimo:
{
  "goal": string,
  "intent": string,
  "target"?: { "type": "book"|"cube"|"zone"|"none", "id"?: string, "position"?: [number, number, number] },
  "transient"?: { "jump"?: boolean, "colorShift"?: string, "lightPulse"?: boolean },
  "learning"?: { "addTraits"?: string[], "addFacts"?: string[], "addPreferences"?: string[] },
  "mood"?: string,
  "personalityShift"?: "more_calm"|"more_curious"|"more_extrovert"|"more_chaotic"|"more_neutral"|"none",
  "ttlMs"?: number
}
- Mantén las cadenas CORTAS y concretas.
- Si no hay objetivo, usa { "type": "none" }.
- Si sugieres saltar, usa transient.jump=true.
- Si sugieres resaltar estado emocional, usa transient.colorShift (hex por ejemplo "#ffaa00").
- Personalidad actual: ${personality}. Tu decisión debe respetarla, pero puede evolucionar sutilmente.`;
}

function buildPlannerUserMessage(cubeId: string, personality: Personality, lastUserMessage: string): string {
  const memory = getCubeMemory(cubeId);
  const memoryCtx = memory ? buildMemoryContext(memory) : "";
  const worldCtx = buildWorldKnowledgeContext(lastUserMessage || "");
  const lines: string[] = [];
  if (worldCtx) lines.push(worldCtx);
  if (memoryCtx) lines.push(memoryCtx);
  lines.push("[ESTADO ACTUAL]");
  const cubeState = getCube(cubeId);
  if (cubeState) {
    lines.push(`Posición: [${cubeState.position.join(", ")}]`);
    lines.push(`Personalidad: ${cubeState.personality}`);
  } else {
    lines.push(`Posición: desconocida`);
    lines.push(`Personalidad: ${personality}`);
  }
  lines.push("");
  lines.push("[MENSAJE/CONTEXTO]");
  lines.push(lastUserMessage || "");
  lines.push("");
  lines.push("Devuelve SOLO JSON válido conforme al esquema.");
  return lines.join("\n");
}

function safeParseDecision(jsonText: string): BehaviorDecision | null {
  try {
    const parsed = JSON.parse(jsonText) as BehaviorDecision;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.goal || !parsed.intent) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function planBehavior(
  cubeId: string,
  personality: Personality,
  lastUserMessage: string
): Promise<BehaviorDecision | null> {
  const { localUrl, fallbackModel } = getPlannerConfig();

  const system = buildPlannerSystemPrompt(personality);
  const user = buildPlannerUserMessage(cubeId, personality, lastUserMessage);

  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  try {
    const res = await fetch(localUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: fallbackModel, messages }),
    });
    if (!res.ok) {
      // Planner is best-effort; fail silently
      return null;
    }
    const data = await res.json();
    const extractContent = (raw: unknown): string | null => {
      if (!raw) return null;
      if (typeof raw === "string") return raw.trim();
      
      // Type guard para objeto con propiedades dinámicas
      if (typeof raw !== "object") return null;
      
      // Ollama format
      const maybeOllamaFormat = raw as { message?: { content?: unknown } };
      const mc = maybeOllamaFormat.message?.content;
      if (typeof mc === "string" && mc.trim()) return mc.trim();
      
      // Alternate keys
      const maybeRecord = raw as Record<string, unknown>;
      for (const k of ["response", "reply", "text"]) {
        const v = maybeRecord[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
      return null;
    };
    const trimmed = extractContent(data);
    if (!trimmed) return null;
    const decision = safeParseDecision(trimmed);
    if (!decision) return null;

    // Apply learning side-effects into memory immediately (best-effort)
    if (decision.learning) {
      try {
        updateCubeMemory(cubeId, {
          addTraits: decision.learning.addTraits,
          addFacts: decision.learning.addFacts,
          addPreferences: decision.learning.addPreferences,
          intent: "observation",
        });
      } catch {
        // ignore memory update errors
      }
    }

    // Store decision into community for consumers
    const ttl = typeof decision.ttlMs === "number" ? decision.ttlMs : DEFAULT_TTL_MS;
    const expiresAt = Date.now() + Math.max(1000, Math.min(ttl, 15000));
    updateCube(cubeId, {
      behaviorState: { ...decision, ttlMs: expiresAt - Date.now() },
      transientAction: decision.transient
        ? { ...decision.transient, expiresAt }
        : undefined,
    });

    return decision;
  } catch {
    return null;
  }
}
