/**
 * instrucciones.ts
 * 
 * Directrices centrales para personalidad, emociones, conocimiento y libros.
 * Define cómo cada personalidad prioriza la atención, cómo se aburre,
 * qué cambios produce cada libro (emociones + conocimiento) y cómo
 * podría derivar la personalidad con el aprendizaje.
 */

import type { Personality } from "../../components/CubeList";

// ────────────────────────────────────────────────────────────────
// TIPOS BÁSICOS
// ────────────────────────────────────────────────────────────────

export type TargetType = "book" | "zone" | "cube" | "ambient";
export type EmotionCore = "happy" | "curious" | "sad" | "angry";

export type KnowledgeDomain =
  | "science"
  | "technology"
  | "math"
  | "philosophy"
  | "literature"
  | "art"
  | "music"
  | "nature";

export interface KnowledgeState {
  science: number;
  technology: number;
  math: number;
  philosophy: number;
  literature: number;
  art: number;
  music: number;
  nature: number;
}

// ────────────────────────────────────────────────────────────────
// DIRECTRICES DE PERSONALIDAD
// ────────────────────────────────────────────────────────────────

export interface PersonalityDirective {
  attentionWeights: Record<TargetType, number>; // prioridad atencional
  boredomMultiplier: number; // >1 se aburre más lento, <1 más rápido
  navigation: {
    noise: number; // zigzag/erraticidad
    jumpStrength: number; // impulso vertical
    jumpInterval: number; // segundos entre saltos
  };
  emotionBias?: Partial<Record<EmotionCore, number>>; // sesgo emocional base
}

export const DIRECTIVES_BY_PERSONALITY: Record<Personality, PersonalityDirective> = {
  calm: {
    attentionWeights: { book: 0.7, zone: 0.8, cube: 0.3, ambient: 0.2 },
    boredomMultiplier: 1.2,
    navigation: { noise: 0.1, jumpStrength: 2.8, jumpInterval: 2.5 },
    emotionBias: { happy: 0.2 },
  },
  extrovert: {
    attentionWeights: { book: 0.4, zone: 0.5, cube: 0.9, ambient: 0.6 },
    boredomMultiplier: 0.9,
    navigation: { noise: 0.3, jumpStrength: 3.5, jumpInterval: 1.2 },
    emotionBias: { happy: 0.4 },
  },
  curious: {
    attentionWeights: { book: 0.9, zone: 0.6, cube: 0.5, ambient: 0.7 },
    boredomMultiplier: 1.1,
    navigation: { noise: 0.25, jumpStrength: 3.2, jumpInterval: 1.8 },
    emotionBias: { curious: 0.6 },
  },
  chaotic: {
    attentionWeights: { book: 0.5, zone: 0.4, cube: 0.6, ambient: 0.9 },
    boredomMultiplier: 0.6,
    navigation: { noise: 0.6, jumpStrength: 4.0, jumpInterval: 0.8 },
    emotionBias: { angry: 0.2, happy: 0.2 },
  },
  neutral: {
    attentionWeights: { book: 0.5, zone: 0.5, cube: 0.5, ambient: 0.5 },
    boredomMultiplier: 1.0,
    navigation: { noise: 0.2, jumpStrength: 3.0, jumpInterval: 1.5 },
  },
};

// ────────────────────────────────────────────────────────────────
// LIBROS Y EFECTOS
// ────────────────────────────────────────────────────────────────

export interface BookSpec {
  domain: KnowledgeDomain;
  tags?: string[];
  difficulty?: "basic" | "intermediate" | "advanced";
  affect: {
    emotion: EmotionCore; // emoción primaria evocada
    knowledgeGain: number; // incremento del dominio principal
    personalityDrift?: Partial<Record<Personality, number>>; // tendencia de deriva
    interestBoost?: number; // aumenta interés futuro por libros similares
  };
}

// Efectos por dominio (defaults) — se pueden sobreescribir por libro.
export const DEFAULT_BOOK_EFFECTS: Record<KnowledgeDomain, Omit<BookSpec, "domain">> = {
  science: { affect: { emotion: "curious", knowledgeGain: 2 } },
  technology: { affect: { emotion: "curious", knowledgeGain: 2 } },
  math: { affect: { emotion: "curious", knowledgeGain: 2 } },
  philosophy: { affect: { emotion: "sad", knowledgeGain: 1 } },
  literature: { affect: { emotion: "happy", knowledgeGain: 1 } },
  art: { affect: { emotion: "happy", knowledgeGain: 1 } },
  music: { affect: { emotion: "happy", knowledgeGain: 1 } },
  nature: { affect: { emotion: "curious", knowledgeGain: 1 } },
};

// ────────────────────────────────────────────────────────────────
// ESTADO Y APLICACIÓN DE EFECTOS
// ────────────────────────────────────────────────────────────────

export function createKnowledgeState(): KnowledgeState {
  return {
    science: 0,
    technology: 0,
    math: 0,
    philosophy: 0,
    literature: 0,
    art: 0,
    music: 0,
    nature: 0,
  };
}

export interface EmotiveEffect {
  dominantEmotion: EmotionCore;
  emotionIntensity: number; // 0-1 (heurístico)
  interestBoost?: number;
  personalityHint?: Personality;
}

export interface ApplyBookResult {
  knowledge: KnowledgeState;
  emotive: EmotiveEffect;
  personalityCounters: Partial<Record<Personality, number>>;
}

/**
 * Aplica los efectos de un libro al estado de conocimiento.
 * Devuelve también una sugerencia de emoción dominante y una pista de personalidad.
 */
export function applyBookEffects(
  prev: KnowledgeState,
  book: BookSpec,
  currentPersonality: Personality
): ApplyBookResult {
  const defaults = DEFAULT_BOOK_EFFECTS[book.domain];
  const affect = { ...defaults.affect, ...book.affect };

  // Knowledge update
  const gain = scaleByDifficulty(affect.knowledgeGain, book.difficulty);
  const knowledge: KnowledgeState = { ...prev, [book.domain]: prev[book.domain] + gain } as KnowledgeState;

  // Emotion
  const emotionBaseIntensity = clamp01(0.4 + gain * 0.1);
  const bias = DIRECTIVES_BY_PERSONALITY[currentPersonality].emotionBias || {};
  const biasBoost = clamp01((bias[affect.emotion] || 0) * 0.5);
  const emotionIntensity = clamp01(emotionBaseIntensity + biasBoost);

  // Personality drift counters
  const personalityCounters: Partial<Record<Personality, number>> = {};
  if (affect.personalityDrift) {
    for (const key in affect.personalityDrift) {
      const p = key as Personality;
      personalityCounters[p] = (personalityCounters[p] || 0) + (affect.personalityDrift[p] || 0);
    }
  }

  // Suggest personality hint if any drift dominates
  const personalityHint = pickDominantPersonality(personalityCounters);

  return {
    knowledge,
    emotive: {
      dominantEmotion: affect.emotion,
      emotionIntensity,
      interestBoost: affect.interestBoost,
      personalityHint,
    },
    personalityCounters,
  };
}

// ────────────────────────────────────────────────────────────────
// UTILIDADES
// ────────────────────────────────────────────────────────────────

function scaleByDifficulty(base: number, difficulty: BookSpec["difficulty"]): number {
  switch (difficulty) {
    case "basic":
      return base * 0.8;
    case "intermediate":
      return base * 1.0;
    case "advanced":
      return base * 1.4;
    default:
      return base;
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function pickDominantPersonality(
  counters: Partial<Record<Personality, number>>
): Personality | undefined {
  let best: Personality | undefined;
  let bestScore = 0;
  for (const p of Object.keys(counters) as Personality[]) {
    const score = counters[p] || 0;
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

// ────────────────────────────────────────────────────────────────
// PRESETS DE LIBROS (EJEMPLOS)
// ────────────────────────────────────────────────────────────────

export const SAMPLE_BOOKS: BookSpec[] = [
  {
    domain: "science",
    tags: ["physics", "curiosity"],
    difficulty: "intermediate",
    affect: {
      emotion: "curious",
      knowledgeGain: 2,
      personalityDrift: { curious: 0.6 },
      interestBoost: 0.2,
    },
  },
  {
    domain: "art",
    tags: ["color", "composition"],
    difficulty: "basic",
    affect: {
      emotion: "happy",
      knowledgeGain: 1,
      personalityDrift: { extrovert: 0.3, calm: 0.2 },
    },
  },
  {
    domain: "philosophy",
    tags: ["ethics", "meaning"],
    difficulty: "advanced",
    affect: {
      emotion: "sad",
      knowledgeGain: 2,
      personalityDrift: { neutral: 0.3, calm: 0.2 },
    },
  },
];
