/**
 * AutonomousThinking.ts
 *
 * Sistema de pensamiento autónomo: permite que los NPCs "piensen" periódicamente
 * sin necesidad de interacción del usuario.
 *
 * Bucle: cubo observa → IA piensa → cubo evoluciona
 */

import type { Personality } from "../ui/components/CubeList";
import { getCube } from "./Community";
import { getCubeMemory } from "../services/CubeMemory.service";
import { planBehaviorAutonomous } from "../services/BehaviorPlanner.service";

/**
 * Intervalos de pensamiento autónomo por personalidad (en segundos)
 */
export const THINKING_INTERVALS: Record<Personality, number> = {
  curious: 15,    // Piensa frecuentemente, siempre explorando
  chaotic: 10,    // Pensamientos rápidos e impredecibles
  extrovert: 20,  // Piensa en intervalos medios
  calm: 40,       // Reflexiona pausadamente
  neutral: 30,    // Intervalo neutral
};

/**
 * Intervalos mínimos/máximos para evitar spam o estancamiento
 */
const MIN_INTERVAL = 8;   // No menos de 8 segundos
const MAX_INTERVAL = 60;  // No más de 60 segundos

/**
 * Obtiene el intervalo de pensamiento para una personalidad (con randomización)
 */
export function getThinkingInterval(personality: Personality): number {
  const base = THINKING_INTERVALS[personality];
  // Añadir ±20% de variación aleatoria para naturalidad
  const variance = base * 0.2;
  const randomized = base + (Math.random() * variance * 2 - variance);
  return Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, randomized));
}

/**
 * Construye el contexto interno del cubo para pensamiento autónomo
 */
function buildAutonomousContext(cubeId: string): string {
  const cubeState = getCube(cubeId);
  const memory = getCubeMemory(cubeId);

  const lines: string[] = [];

  lines.push("[CONTEXTO AUTÓNOMO - PENSAMIENTO INTERNO]");
  lines.push("");
  lines.push("Nadie te ha hablado recientemente. Estás reflexionando sobre tu existencia.");
  lines.push("");

  if (cubeState) {
    lines.push("[ESTADO ACTUAL]");
    lines.push(`Posición: [${cubeState.position.map(p => p.toFixed(1)).join(", ")}]`);
    lines.push(`Personalidad: ${cubeState.personality}`);
    
    // Conocimiento acumulado
    if (cubeState.knowledge) {
      const totalKnowledge = Object.values(cubeState.knowledge).reduce((sum, val) => sum + val, 0);
      if (totalKnowledge > 0) {
        lines.push(`Conocimiento total: ${totalKnowledge.toFixed(1)}`);
        const domains = Object.entries(cubeState.knowledge)
          .filter(([, val]) => val > 0)
          .map(([domain, val]) => `${domain}: ${val.toFixed(1)}`);
        if (domains.length > 0) {
          lines.push(`Dominios: ${domains.join(", ")}`);
        }
      }
    }

    // Experiencias de lectura
    if (cubeState.readingExperiences) {
      const { booksRead, conceptsLearned = [], traitsAcquired } = cubeState.readingExperiences;
      if (booksRead.length > 0) {
        lines.push(`Libros leídos: ${booksRead.length} (último: "${booksRead[booksRead.length - 1]}")`);
      }
      if (conceptsLearned.length > 0) {
        lines.push(`Conceptos aprendidos: ${conceptsLearned.slice(-5).join(", ")}`);
      }
      if (traitsAcquired.length > 0) {
        lines.push(`Rasgos adquiridos: ${traitsAcquired.join(", ")}`);
      }
    }

    lines.push("");
  }

  if (memory) {
    lines.push("[MEMORIA]");
    if (memory.traits.length > 0) {
      lines.push(`Rasgos: ${memory.traits.slice(-3).join(", ")}`);
    }
    if (memory.facts.length > 0) {
      lines.push(`Hechos recordados: ${memory.facts.slice(-3).join(", ")}`);
    }
    if (memory.preferences.length > 0) {
      lines.push(`Preferencias: ${memory.preferences.slice(-3).join(", ")}`);
    }
    lines.push("");
  }

  lines.push("[REFLEXIÓN]");
  lines.push("Reflexiona sobre:");
  lines.push("- ¿Qué has aprendido últimamente?");
  lines.push("- ¿Qué meta quieres perseguir ahora?");
  lines.push("- ¿Hay algo que quieras mejorar de ti mismo?");
  lines.push("- ¿Cómo te sientes en este momento?");
  lines.push("");
  lines.push("Devuelve JSON con tu decisión de comportamiento (goal/intent/mood/learning/personalityShift).");

  return lines.join("\n");
}

/**
 * Ejecuta un tick de pensamiento autónomo
 * 
 * @param cubeId - ID del cubo
 * @param personality - Personalidad del cubo
 * @returns Promise que resuelve cuando el pensamiento se completa
 */
export async function performAutonomousTick(
  cubeId: string,
  personality: Personality
): Promise<void> {
  try {
    const context = buildAutonomousContext(cubeId);
    
    // Llamar al planner en modo autónomo
    await planBehaviorAutonomous(cubeId, personality, context);
    
    console.log(`🧠 [${cubeId}] Pensamiento autónomo ejecutado`);
  } catch (error) {
    // Pensamiento autónomo es best-effort, no interrumpir flujo
    console.warn(`⚠️ [${cubeId}] Error en pensamiento autónomo:`, error);
  }
}

/**
 * Verifica si el cubo debería pensar ahora (throttling básico)
 */
export function shouldThinkNow(
  lastThinkTime: number,
  personality: Personality,
  currentTime: number
): boolean {
  const interval = getThinkingInterval(personality) * 1000; // Convertir a ms
  return currentTime - lastThinkTime >= interval;
}
