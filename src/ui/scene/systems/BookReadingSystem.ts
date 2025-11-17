/**
 * Book Reading System
 * Processes book content and applies emotional/personality changes to cubes
 */

import type { BookContent, BookEmotion } from "../data/booksLibrary";
import { shouldReadBook } from "../data/booksLibrary";

export interface ReadingState {
  currentBook: BookContent | null;
  readingProgress: number; // 0-1, how much of book has been read
  readingStartTime: number;
  emotionalState: BookEmotion[];
  traitsAcquired: string[];
}

export interface PersonalityChangeResult {
  shouldChange: boolean;
  newPersonality?: "calm" | "curious" | "extrovert" | "chaotic" | "neutral";
  reason?: string;
}

/**
 * Decide if cube wants to read this book based on personality affinity
 */
export function decideTORead(
  book: BookContent,
  personality: "calm" | "curious" | "extrovert" | "chaotic" | "neutral"
): boolean {
  return shouldReadBook(book, personality);
}

/**
 * Calculate reading speed based on personality and book difficulty
 */
export function getReadingSpeed(
  personality: "calm" | "curious" | "extrovert" | "chaotic" | "neutral",
  difficulty: "básica" | "intermedia" | "avanzada"
): number {
  // Base speeds per second
  const baseSpeed: Record<typeof personality, number> = {
    curious: 0.12, // Fastest reader
    calm: 0.08,
    neutral: 0.07,
    extrovert: 0.06, // Gets distracted
    chaotic: 0.05, // Most distracted/impatient
  };

  const difficultyMultiplier = difficulty === "avanzada" ? 0.5 : difficulty === "intermedia" ? 0.7 : 1.0;

  return baseSpeed[personality] * difficultyMultiplier;
}

/**
 * Process emotions from reading a book chunk
 * Returns dominant emotion and thought text
 */
export function processEmotions(
  book: BookContent,
  _progress: number,
  personality: "calm" | "curious" | "extrovert" | "chaotic" | "neutral"
): { emotion: BookEmotion; thought: string } {
  const propiedades = book.propiedades;
  const emociones_positivas = propiedades.emociones_positivas;
  const emociones_negativas = propiedades.emociones_negativas;
  const affinity = book.afinidad[personality];

  // Early in book: more likely to experience emotions
  // Negative emotions dominate if affinity is low
  const preferPositive = affinity > 0.5;
  const emotionPool = preferPositive ? emociones_positivas : emociones_negativas;

  if (emotionPool.length === 0) {
    return { emotion: "Curiosidad", thought: `Leyendo "${book.titulo}"...` };
  }

  const emotion = emotionPool[Math.floor(Math.random() * emotionPool.length)];

  // Generate context-aware thought
  const thoughts: Record<string, string[]> = {
    Esperanza: [`"${book.titulo}" me da esperanza...`, "Esto es inspirador!", "¿Puedo lograr eso?"],
    Miedo: ["Esto es aterrador...", "No quiero seguir leyendo", "¿Y si es verdad?"],
    Asco: ["Qué repulsivo...", "No puedo creer esto", "Basta, no más"],
    Fascinación: ["¡Increíble!", "No puedo dejar de leer", "¿Cómo es posible?"],
    Curiosidad: ["Hmm, interesante...", "¿Qué sigue?", "Déjame ver..."],
    Alegría: ["¡Me encanta este libro!", "Weee, qué bueno!", "Esto es genial"],
    Tristeza: ["Qué triste historia...", "Me parte el corazón", "Plof... tan melancólico"],
    Ira: ["¡Esto me enfurece!", "Grr, inaceptable", "¿Cómo se atreven?"],
    Confusión: ["¿Qué significa esto?", "Estoy perdido...", "No entiendo nada"],
    Admiración: ["Qué obra maestra", "Impresionante", "Genio puro"],
    Aburrimiento: ["Zzz...", "Qué aburrido", "Ya me quiero ir"],
  };

  const thoughtList = thoughts[emotion as keyof typeof thoughts] || [`Leyendo sobre ${book.genero}...`];
  const thought = thoughtList[Math.floor(Math.random() * thoughtList.length)];

  return { emotion, thought };
}

/**
 * Check if personality should change after finishing a book
 */
export function checkPersonalityChange(
  book: BookContent,
  currentPersonality: "calm" | "curious" | "extrovert" | "chaotic" | "neutral"
): PersonalityChangeResult {
  const changeRules = book.propiedades.cambio_personalidad;

  if (!changeRules || !(currentPersonality in changeRules)) {
    return { shouldChange: false };
  }

  const rule = changeRules[currentPersonality as keyof typeof changeRules];
  if (!rule) {
    return { shouldChange: false };
  }

  // Roll dice
  const roll = Math.random();
  if (roll < rule.probabilidad) {
    return {
      shouldChange: true,
      newPersonality: rule.nuevo,
      reason: `"${book.titulo}" cambió mi forma de ver el mundo...`,
    };
  }

  return { shouldChange: false };
}

/**
 * Apply knowledge gains from reading
 */
export function applyKnowledgeGains(
  currentKnowledge: Record<string, number>,
  book: BookContent,
  readingChunk: number // how much was read this tick (0-1)
): Record<string, number> {
  const newKnowledge = { ...currentKnowledge };
  const propiedades = book.propiedades;
  const conocimientos = propiedades.conocimientos;

  // Each knowledge domain gains based on chunk read
  conocimientos.forEach((domain) => {
    const domainKey = domain.toLowerCase();
    const current = newKnowledge[domainKey] || 0;
    const gain = readingChunk * 0.5; // 50% knowledge gain per full read
    newKnowledge[domainKey] = Math.min(10, current + gain);
  });

  return newKnowledge;
}

/**
 * Get a thought based on book category
 */
export function getCategoryThought(category: BookContent["categoria"]): string {
  const thoughts: Record<typeof category, string[]> = {
    importante: ["Este libro es un clásico", "Fundamental para entender el mundo", "Denso pero valioso"],
    controversial: ["¿Debería estar leyendo esto?", "Hmm, polémico...", "Entiendo la controversia"],
    artístico: ["Qué belleza literaria", "El lenguaje es exquisito", "Arte en palabras"],
    caótico: ["Mi cabeza da vueltas", "¿Qué acabo de leer?", "Caos hermoso"],
  };

  const list = thoughts[category];
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Create initial reading state
 */
export function createReadingState(): ReadingState {
  return {
    currentBook: null,
    readingProgress: 0,
    readingStartTime: 0,
    emotionalState: [],
    traitsAcquired: [],
  };
}

/**
 * Start reading a new book
 */
export function startReading(book: BookContent, currentTime: number): ReadingState {
  return {
    currentBook: book,
    readingProgress: 0,
    readingStartTime: currentTime,
    emotionalState: [],
    traitsAcquired: [],
  };
}

/**
 * Finish reading and clear state
 */
export function finishReading(): ReadingState {
  return createReadingState();
}
