/**
 * AttentionSystem.ts
 *
 * Maneja el sistema de atención de los cubos: qué les interesa, cuándo observan,
 * y cuándo se aburren. Los libros son objetivos estáticos. Los cubos tienen memoria
 * y pueden aburrirse según su personalidad/estado emocional.
 */

import type { Object3D } from "three";
import type { Personality } from "../ui/components/CubeList";

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────

export type TargetType = "book" | "zone" | "cube" | "ambient";

type PositionLike = { position: { x: number; y: number; z: number } };

export interface AttentionTarget {
  object: Object3D | PositionLike; // Referencia al objeto Three.js o un objeto con posición
  type: TargetType;
  position: [number, number, number];
  interestLevel: number; // 0-1, calculado según personalidad
  discoveredAt: number; // timestamp cuando se descubrió
  lastVisitedAt?: number; // timestamp de última visita
  visitCount: number; // cuántas veces ha visitado
  // Opcional: metadatos para libros
  domain?: string;
  difficulty?: "basic" | "intermediate" | "advanced";
}

export interface AttentionState {
  currentTarget: AttentionTarget | null;
  targetHistory: AttentionTarget[]; // memoria de objetivos visitados
  interestTimer: number; // tiempo observando objetivo actual
  boredomThreshold: number; // cuánto tiempo antes de aburrirse (varía por personalidad)
}

// ────────────────────────────────────────────────────────────────
// PERSONALITY-DRIVEN WEIGHTS
// ────────────────────────────────────────────────────────────────

/**
 * Pesos de interés según tipo de objetivo y personalidad.
 * calm: prefiere zonas tranquilas, libros conocidos
 * extrovert: prefiere otros cubos, zonas activas
 * curious: prefiere libros nuevos, exploración
 * chaotic: prefiere ambiente, cambios frecuentes
 */
const INTEREST_WEIGHTS: Record<Personality, Record<TargetType, number>> = {
  calm: {
    book: 0.7,
    zone: 0.8, // Prefiere zonas específicas
    cube: 0.3,
    ambient: 0.2,
  },
  extrovert: {
    book: 0.4,
    zone: 0.5,
    cube: 0.9, // Le interesan otros cubos
    ambient: 0.6,
  },
  curious: {
    book: 0.9, // ¡Libros! Conocimiento
    zone: 0.6,
    cube: 0.5,
    ambient: 0.7,
  },
  chaotic: {
    book: 0.5,
    zone: 0.4,
    cube: 0.6,
    ambient: 0.9, // Le interesa el caos
  },
  neutral: {
    book: 0.5,
    zone: 0.5,
    cube: 0.5,
    ambient: 0.5,
  },
};

/**
 * Umbrales de aburrimiento (segundos) según personalidad.
 * chaotic se aburre rápido, calm puede observar mucho tiempo.
 */
const BOREDOM_THRESHOLDS: Record<Personality, number> = {
  calm: 15, // Puede quedarse 15s observando
  extrovert: 8, // Se aburre medio rápido
  curious: 12, // Investiga bastante
  chaotic: 4, // Se aburre super rápido
  neutral: 10,
};

// ────────────────────────────────────────────────────────────────
// INTEREST COMPUTATION
// ────────────────────────────────────────────────────────────────

/**
 * Calcula el nivel de interés hacia un objetivo dado.
 *
 * Factores:
 * - Peso base según personalidad y tipo
 * - Penalización por visitas previas (memoria)
 * - Bonus por novedad (nunca visitado)
 * - Distancia (más cerca = más interés, hasta cierto punto)
 */
export function computeInterest(
  targetType: TargetType,
  personality: Personality,
  distance: number,
  visitCount: number,
  isNew: boolean
): number {
  // Peso base según personalidad
  const baseWeight = INTEREST_WEIGHTS[personality][targetType];

  // Bonus por novedad
  const noveltyBonus = isNew ? 0.3 : 0;

  // Penalización por visitas repetidas (la memoria hace que se aburra de lo conocido)
  const visitPenalty = Math.min(visitCount * 0.15, 0.6);

  // Factor de distancia: más cerca = más interés.
  // Usamos una caída suave (hiperbólica) para permitir objetivos lejanos:
  // - 0: 1.0
  // - 25: ~0.5
  // - 50: ~0.33
  // - 100: ~0.2
  const distanceFactor = 1 / (1 + distance / 25);

  // Combinación final
  let interest = baseWeight + noveltyBonus - visitPenalty;
  interest *= distanceFactor;

  return Math.max(0, Math.min(1, interest));
}

// ────────────────────────────────────────────────────────────────
// SCANNING
// ────────────────────────────────────────────────────────────────

/**
 * Escanea el entorno y retorna el objetivo más interesante.
 *
 * @param cubePosition Posición actual del cubo
 * @param personality Personalidad del cubo
 * @param targetHistory Historial de objetivos visitados
 * @param availableTargets Lista de objetivos detectables (libros, zonas, etc.)
 * @returns El objetivo más interesante o null si ninguno supera el umbral
 */
export function scanForTargets(
  cubePosition: [number, number, number],
  personality: Personality,
  targetHistory: AttentionTarget[],
  availableTargets: Array<{
    object: Object3D | PositionLike;
    type: TargetType;
    domain?: string;
    difficulty?: "basic" | "intermediate" | "advanced";
  }>
): AttentionTarget | null {
  const MIN_INTEREST = 0.15; // Umbral mínimo para considerar un objetivo (más permisivo)

  let bestTarget: AttentionTarget | null = null;
  let bestInterest = MIN_INTEREST;

  for (const { object, type, domain, difficulty } of availableTargets) {
    const targetPos = (object as PositionLike | Object3D)
      .position as PositionLike["position"];
    const distance = Math.sqrt(
      (targetPos.x - cubePosition[0]) ** 2 +
        (targetPos.y - cubePosition[1]) ** 2 +
        (targetPos.z - cubePosition[2]) ** 2
    );

    // Buscar en historial si ya visitó este objetivo
    const historyEntry = targetHistory.find((t) => t.object === object);
    const visitCount = historyEntry?.visitCount ?? 0;
    const isNew = !historyEntry;

    const interest = computeInterest(
      type,
      personality,
      distance,
      visitCount,
      isNew
    );

    if (interest > bestInterest) {
      bestInterest = interest;
      bestTarget = {
        object,
        type,
        position: [targetPos.x, targetPos.y, targetPos.z],
        interestLevel: interest,
        discoveredAt: Date.now(),
        visitCount,
        lastVisitedAt: historyEntry?.lastVisitedAt,
        domain,
        difficulty,
      };
    }
  }

  return bestTarget;
}

// ────────────────────────────────────────────────────────────────
// BOREDOM
// ────────────────────────────────────────────────────────────────

/**
 * Determina si el cubo se ha aburrido del objetivo actual.
 */
export function isBoredOf(
  target: AttentionTarget,
  personality: Personality,
  observationTime: number
): boolean {
  const threshold = BOREDOM_THRESHOLDS[personality];

  // Si el interés es muy bajo, se aburre más rápido
  const interestMultiplier = target.interestLevel < 0.4 ? 0.5 : 1;

  return observationTime >= threshold * interestMultiplier;
}

// ────────────────────────────────────────────────────────────────
// MEMORY
// ────────────────────────────────────────────────────────────────

/**
 * Actualiza el historial de memoria al visitar un objetivo.
 */
export function recordVisit(
  targetHistory: AttentionTarget[],
  target: AttentionTarget
): AttentionTarget[] {
  const existingIndex = targetHistory.findIndex(
    (t) => t.object === target.object
  );

  const updatedTarget: AttentionTarget = {
    ...target,
    visitCount: target.visitCount + 1,
    lastVisitedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    // Actualizar entrada existente
    const newHistory = [...targetHistory];
    newHistory[existingIndex] = updatedTarget;
    return newHistory;
  } else {
    // Agregar nueva entrada
    return [...targetHistory, updatedTarget];
  }
}

/**
 * Inicializa el estado de atención para un cubo.
 */
export function createAttentionState(): AttentionState {
  return {
    currentTarget: null,
    targetHistory: [],
    interestTimer: 0,
    boredomThreshold: 10, // Default, se ajustará por personalidad
  };
}
