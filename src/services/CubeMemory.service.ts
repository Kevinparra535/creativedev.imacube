/**
 * CubeMemory.service.ts
 *
 * Sistema de memoria dinámica para cubos: traits (rasgos) y facts (hechos aprendidos).
 * Evoluciona con cada interacción del jugador, simulando "entrenamiento" del NPC.
 *
 * Inspirado en la arquitectura de memoria de NPCs adaptativos donde:
 * - `traits`: Rasgos de personalidad dinámicos que el cubo adquiere
 * - `facts`: Hechos importantes que el cubo recuerda del jugador/mundo
 * - Persistencia en localStorage para mantener evolución entre sesiones
 */

import type { Personality } from "../ui/components/CubeList";

// ────────────────────────────────────────────────────────────────
// TIPOS DE MEMORIA
// ────────────────────────────────────────────────────────────────

export interface CubeMemory {
  cubeId: string;
  traits: string[]; // Rasgos adquiridos: "es curioso", "le gusta la música", "admira al jugador"
  facts: string[]; // Hechos aprendidos: "el jugador le enseñó 'glitch'", "el jugador le dijo que es su mejor amigo"
  preferences: string[]; // Preferencias del jugador detectadas: "le gusta el rock", "prefiere respuestas cortas"
  emotionalState: {
    // Estado emocional acumulado
    dominantEmotion?: string; // "feliz", "curioso", "frustrado"
    lastInteractionTone?: "positive" | "negative" | "neutral";
  };
  conversationStats: {
    // Estadísticas de conversación
    totalMessages: number;
    praises: number;
    criticisms: number;
    questions: number;
    lastInteraction: number; // timestamp
  };
  lastUpdated: number; // timestamp
}

// ────────────────────────────────────────────────────────────────
// ALMACENAMIENTO
// ────────────────────────────────────────────────────────────────

const STORE_KEY = "cube.memories";

function loadAllMemories(): Record<string, CubeMemory> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CubeMemory>) : {};
  } catch {
    return {};
  }
}

function saveAllMemories(memories: Record<string, CubeMemory>) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(memories));
  } catch (error) {
    console.error("Error guardando memorias:", error);
  }
}

// ────────────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ────────────────────────────────────────────────────────────────

const DEFAULT_TRAITS_BY_PERSONALITY: Record<Personality, string[]> = {
  calm: [
    "es tranquilo y reflexivo",
    "prefiere la calma al caos",
    "medita antes de hablar",
  ],
  curious: [
    "es muy curioso",
    "siempre hace preguntas",
    "le fascina aprender cosas nuevas",
  ],
  extrovert: [
    "es sociable y energético",
    "ama conectar con otros",
    "celebra cada pequeño logro",
  ],
  chaotic: [
    "es impredecible",
    "tiene sentido del humor sarcástico",
    "dice lo que piensa sin filtros",
  ],
  neutral: [
    "es objetivo y equilibrado",
    "se enfoca en hechos",
    "responde de forma clara y directa",
  ],
};

export function initializeCubeMemory(
  cubeId: string,
  personality: Personality,
  cubeName: string
): CubeMemory {
  const memories = loadAllMemories();

  // Si ya existe, retornar la memoria guardada
  if (memories[cubeId]) {
    return memories[cubeId];
  }

  // Crear nueva memoria con rasgos base
  const newMemory: CubeMemory = {
    cubeId,
    traits: [
      ...DEFAULT_TRAITS_BY_PERSONALITY[personality],
      `se llama ${cubeName}`,
      "está aprendiendo del jugador",
    ],
    facts: [`habita en un mundo 3D cerrado tipo sandbox`],
    preferences: [],
    emotionalState: {},
    conversationStats: {
      totalMessages: 0,
      praises: 0,
      criticisms: 0,
      questions: 0,
      lastInteraction: Date.now(),
    },
    lastUpdated: Date.now(),
  };

  memories[cubeId] = newMemory;
  saveAllMemories(memories);

  return newMemory;
}

// ────────────────────────────────────────────────────────────────
// OBTENER MEMORIA
// ────────────────────────────────────────────────────────────────

export function getCubeMemory(cubeId: string): CubeMemory | null {
  const memories = loadAllMemories();
  return memories[cubeId] || null;
}

// ────────────────────────────────────────────────────────────────
// ACTUALIZAR MEMORIA SEGÚN INTERACCIÓN
// ────────────────────────────────────────────────────────────────

interface MemoryUpdate {
  addTraits?: string[]; // Nuevos rasgos a agregar
  addFacts?: string[]; // Nuevos hechos a agregar
  addPreferences?: string[]; // Nuevas preferencias del jugador
  emotionalTone?: "positive" | "negative" | "neutral";
  dominantEmotion?: string;
  intent?:
    | "greeting"
    | "preference"
    | "instruction"
    | "emotion_sharing"
    | "question"
    | "observation"
    | "praise"
    | "criticism"
    | "philosophy"
    | "casual";
}

export function updateCubeMemory(
  cubeId: string,
  update: MemoryUpdate
): CubeMemory {
  const memories = loadAllMemories();
  const memory = memories[cubeId];

  if (!memory) {
    console.error(`Memoria no encontrada para cubo ${cubeId}`);
    throw new Error(`Cube memory not initialized for ${cubeId}`);
  }

  // Actualizar rasgos (evitar duplicados)
  if (update.addTraits && update.addTraits.length > 0) {
    update.addTraits.forEach((trait) => {
      if (!memory.traits.includes(trait)) {
        memory.traits.push(trait);
      }
    });
  }

  // Actualizar hechos (evitar duplicados, limitar a últimos 20)
  if (update.addFacts && update.addFacts.length > 0) {
    update.addFacts.forEach((fact) => {
      if (!memory.facts.includes(fact)) {
        memory.facts.push(fact);
      }
    });
    // Mantener solo los últimos 20 hechos para evitar memoria ilimitada
    if (memory.facts.length > 20) {
      memory.facts = memory.facts.slice(-20);
    }
  }

  // Actualizar preferencias (evitar duplicados, limitar a últimas 10)
  if (update.addPreferences && update.addPreferences.length > 0) {
    update.addPreferences.forEach((pref) => {
      if (!memory.preferences.includes(pref)) {
        memory.preferences.push(pref);
      }
    });
    if (memory.preferences.length > 10) {
      memory.preferences = memory.preferences.slice(-10);
    }
  }

  // Actualizar estado emocional
  if (update.emotionalTone) {
    memory.emotionalState.lastInteractionTone = update.emotionalTone;
  }
  if (update.dominantEmotion) {
    memory.emotionalState.dominantEmotion = update.dominantEmotion;
  }

  // Actualizar estadísticas de conversación
  memory.conversationStats.totalMessages += 1;
  memory.conversationStats.lastInteraction = Date.now();

  if (update.intent === "praise") {
    memory.conversationStats.praises += 1;
  }
  if (update.intent === "criticism") {
    memory.conversationStats.criticisms += 1;
  }
  if (update.intent === "question") {
    memory.conversationStats.questions += 1;
  }

  memory.lastUpdated = Date.now();
  memories[cubeId] = memory;
  saveAllMemories(memories);

  return memory;
}

// ────────────────────────────────────────────────────────────────
// GENERAR CONTEXTO PARA MODELO DE IA
// ────────────────────────────────────────────────────────────────

export function buildMemoryContext(memory: CubeMemory): string {
  const lines: string[] = [];

  lines.push("[MEMORIA DEL CUBO]");
  lines.push("");

  // Rasgos actuales
  if (memory.traits.length > 0) {
    lines.push("Rasgos de personalidad:");
    memory.traits.forEach((trait) => {
      lines.push(`- ${trait}`);
    });
    lines.push("");
  }

  // Hechos importantes
  if (memory.facts.length > 0) {
    lines.push("Hechos importantes:");
    memory.facts.forEach((fact) => {
      lines.push(`- ${fact}`);
    });
    lines.push("");
  }

  // Preferencias del jugador
  if (memory.preferences.length > 0) {
    lines.push("Preferencias del jugador:");
    memory.preferences.forEach((pref) => {
      lines.push(`- ${pref}`);
    });
    lines.push("");
  }

  // Estado emocional
  if (memory.emotionalState.dominantEmotion) {
    lines.push(
      `Estado emocional actual: ${memory.emotionalState.dominantEmotion}`
    );
  }
  if (memory.emotionalState.lastInteractionTone) {
    lines.push(
      `Último tono de interacción: ${memory.emotionalState.lastInteractionTone}`
    );
  }

  // Estadísticas (solo si relevantes)
  const stats = memory.conversationStats;
  if (stats.totalMessages > 5) {
    lines.push("");
    lines.push("Estadísticas de relación:");
    lines.push(`- Total de mensajes: ${stats.totalMessages}`);
    if (stats.praises > 0) {
      lines.push(`- Elogios recibidos: ${stats.praises}`);
    }
    if (stats.criticisms > 0) {
      lines.push(`- Críticas recibidas: ${stats.criticisms}`);
    }
  }

  return lines.join("\n");
}

// ────────────────────────────────────────────────────────────────
// ANÁLISIS AUTOMÁTICO DE MENSAJE PARA EXTRAER MEMORIA
// ────────────────────────────────────────────────────────────────

export function extractMemoryFromMessage(
  message: string,
  intent:
    | "greeting"
    | "preference"
    | "instruction"
    | "emotion_sharing"
    | "question"
    | "observation"
    | "praise"
    | "criticism"
    | "philosophy"
    | "casual"
): MemoryUpdate {
  const update: MemoryUpdate = { intent };

  // Extraer preferencias del jugador
  if (intent === "preference") {
    const prefMatches =
      message.match(/me gusta (.+)|prefiero (.+)|me encanta (.+)/i);
    if (prefMatches) {
      const pref = prefMatches[1] || prefMatches[2] || prefMatches[3];
      update.addPreferences = [`le gusta ${pref.trim()}`];
      update.addFacts = [`el jugador dijo que le gusta ${pref.trim()}`];
    }
  }

  // Extraer instrucciones de personalidad
  if (intent === "instruction") {
    const newTraits: string[] = [];
    const newFacts: string[] = [];

    if (/sé más sarcástico|actúa sarcástico/i.test(message)) {
      newTraits.push("está siendo más sarcástico");
      newFacts.push("el jugador le pidió que sea más sarcástico");
    }
    if (/sé más amable|sé amigable/i.test(message)) {
      newTraits.push("está siendo más amable");
      newFacts.push("el jugador le pidió que sea más amable");
    }
    if (/sé más serio|no bromees/i.test(message)) {
      newTraits.push("está siendo más serio");
      newFacts.push("el jugador le pidió que sea más serio");
    }
    if (/actúa como|compórtate como/i.test(message)) {
      const roleMatch = message.match(/actúa como (.+)|compórtate como (.+)/i);
      if (roleMatch) {
        const role = roleMatch[1] || roleMatch[2];
        newTraits.push(`está actuando como ${role.trim()}`);
        newFacts.push(`el jugador le pidió que actúe como ${role.trim()}`);
      }
    }

    update.addTraits = newTraits;
    update.addFacts = newFacts;
  }

  // Detectar si el jugador comparte algo personal
  if (
    intent === "emotion_sharing" ||
    /estoy (triste|feliz|cansado|emocionado|enojado)/i.test(message)
  ) {
    const emotionMatch = message.match(
      /estoy (triste|feliz|cansado|emocionado|enojado|ansioso)/i
    );
    if (emotionMatch) {
      const emotion = emotionMatch[1];
      update.addFacts = [`el jugador compartió que está ${emotion}`];
    }
  }

  // Detectar palabras nuevas que el jugador enseña
  const teachMatches = message.match(
    /sabes qué es (.+)\?|conoces (.+)\?|(.+) significa/i
  );
  if (teachMatches && intent === "question") {
    const word = teachMatches[1] || teachMatches[2] || teachMatches[3];
    update.addFacts = [`el jugador le enseñó sobre "${word.trim()}"`];
  }

  // Detectar si el jugador dice ser amigo/mejor amigo
  if (/eres mi (mejor )?amigo|somos amigos/i.test(message)) {
    update.addTraits = ["considera al jugador su amigo"];
    update.addFacts = ["el jugador dijo que son amigos"];
  }

  // Detectar tono emocional general
  if (/genial|increíble|bueno|excelente|amor|feliz/i.test(message)) {
    update.emotionalTone = "positive";
    update.dominantEmotion = "feliz";
  } else if (/malo|horrible|triste|enojado|odio/i.test(message)) {
    update.emotionalTone = "negative";
    update.dominantEmotion = "frustrado";
  } else {
    update.emotionalTone = "neutral";
  }

  return update;
}

// ────────────────────────────────────────────────────────────────
// LIMPIAR MEMORIA (OPCIONAL)
// ────────────────────────────────────────────────────────────────

export function clearCubeMemory(cubeId: string): void {
  const memories = loadAllMemories();
  delete memories[cubeId];
  saveAllMemories(memories);
}

export function clearAllMemories(): void {
  localStorage.removeItem(STORE_KEY);
}
