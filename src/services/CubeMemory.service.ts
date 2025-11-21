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

/**
 * Episodio de memoria: evento importante con contexto
 */
export interface MemoryEpisode {
  id: string;
  timestamp: number;
  type: "conversation" | "learning" | "emotional" | "achievement";
  summary: string; // Resumen breve del episodio
  emotionalImpact?: "positive" | "negative" | "neutral";
  keywords: string[]; // Palabras clave para búsqueda
}

/**
 * Habilidades numéricas del cubo (0-1)
 */
export interface CubeSkills {
  social: number; // Habilidad social/confianza
  empathy: number; // Empatía hacia el jugador
  assertiveness: number; // Asertividad al hablar
  curiosity: number; // Apertura a aprender
  creativity: number; // Pensamiento creativo
  logic: number; // Pensamiento lógico/analítico
}

/**
 * Meta del cubo con tracking de progreso
 */
export interface CubeGoal {
  id: string;
  type: "short" | "medium" | "long"; // Short: 1-5 min, Medium: 1 sesión, Long: varias sesiones
  description: string; // "Leer 3 libros de filosofía"
  progress: number; // 0-1
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  status: "active" | "completed" | "abandoned";
}

export interface CubeMemory {
  cubeId: string;

  // ────────────────────────────────────────────────────────────────
  // CAPA 1: MEMORIA DE TRABAJO (Short-term)
  // ────────────────────────────────────────────────────────────────
  workingMemory: {
    recentMessages: string[]; // Últimos 5 mensajes
    currentEmotion: string; // Emoción actual
    lastActivity: string; // "leyendo", "navegando", "conversando"
  };

  // ────────────────────────────────────────────────────────────────
  // CAPA 2: MEMORIA EPISÓDICA (Logs de eventos)
  // ────────────────────────────────────────────────────────────────
  episodes: MemoryEpisode[]; // Últimos 50 episodios importantes

  // ────────────────────────────────────────────────────────────────
  // CAPA 3: CORE / IDENTIDAD (Long-term)
  // ────────────────────────────────────────────────────────────────
  coreBeliefs: string[]; // Creencias fundamentales: "El jugador valora la honestidad", "Quiero ser mejor amigo"
  metaGoals: string[]; // Metas de largo plazo: "Ayudar al jugador a sentirse menos solo"
  philosophyStatement?: string; // Declaración filosófica del cubo (generada por síntesis)

  // Rasgos y hechos (existentes, ahora parte del core)
  traits: string[]; // Rasgos adquiridos: "es curioso", "le gusta la música", "admira al jugador"
  facts: string[]; // Hechos aprendidos: "el jugador le enseñó 'glitch'", "el jugador le dijo que es su mejor amigo"
  preferences: string[]; // Preferencias del jugador detectadas: "le gusta el rock", "prefiere respuestas cortas"

  // ────────────────────────────────────────────────────────────────
  // HABILIDADES (Skills numéricas)
  // ────────────────────────────────────────────────────────────────
  skills: CubeSkills;

  // ────────────────────────────────────────────────────────────────
  // METAS ACTIVAS
  // ────────────────────────────────────────────────────────────────
  activeGoals: CubeGoal[];

  // ────────────────────────────────────────────────────────────────
  // SÍNTESIS (Historial de consolidación de memoria)
  // ────────────────────────────────────────────────────────────────
  synthesisHistory: {
    timestamp: number;
    summary: string; // Resumen de lo aprendido en esa síntesis
    skillChanges: Partial<CubeSkills>; // Cambios en habilidades
  }[];

  // Estado emocional acumulado
  emotionalState: {
    dominantEmotion?: string; // "feliz", "curioso", "frustrado"
    lastInteractionTone?: "positive" | "negative" | "neutral";
  };

  // Estadísticas de conversación
  conversationStats: {
    totalMessages: number;
    praises: number;
    criticisms: number;
    questions: number;
    lastInteraction: number; // timestamp
    interactionsSinceSynthesis: number; // Contador para disparar síntesis
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


// POC: valores iniciales muy bajos para permitir crecimiento visible (recién nacidos)
const DEFAULT_SKILLS_BY_PERSONALITY: Record<Personality, CubeSkills> = {
  calm: {
    social: 0.08,
    empathy: 0.12,
    assertiveness: 0.07,
    curiosity: 0.1,
    creativity: 0.1,
    logic: 0.12,
  },
  curious: {
    social: 0.09,
    empathy: 0.09,
    assertiveness: 0.06,
    curiosity: 0.15,
    creativity: 0.12,
    logic: 0.1,
  },
  extrovert: {
    social: 0.15,
    empathy: 0.1,
    assertiveness: 0.12,
    curiosity: 0.1,
    creativity: 0.12,
    logic: 0.07,
  },
  chaotic: {
    social: 0.07,
    empathy: 0.06,
    assertiveness: 0.15,
    curiosity: 0.12,
    creativity: 0.15,
    logic: 0.08,
  },
  neutral: {
    social: 0.1,
    empathy: 0.1,
    assertiveness: 0.1,
    curiosity: 0.1,
    creativity: 0.1,
    logic: 0.1,
  },
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

    // Capa 1: Working Memory
    workingMemory: {
      recentMessages: [],
      currentEmotion: "neutral",
      lastActivity: "idle",
    },

    // Capa 2: Episodic Memory
    episodes: [],

    // Capa 3: Core/Identity
    // POC identidad mínima
    coreBeliefs: ["estoy comenzando a aprender"],
    metaGoals: [],
    philosophyStatement: undefined,
    traits: [
      `se llama ${cubeName}`,
      `personalidad semilla: ${personality}`,
      "recién nacido explorador",
    ],
    facts: ["existo en un sandbox 3D"],
    preferences: [],

    // Skills
    skills: { ...DEFAULT_SKILLS_BY_PERSONALITY[personality] },

    // Active Goals
    activeGoals: [],

    // Synthesis History
    synthesisHistory: [],

    emotionalState: {},
    conversationStats: {
      totalMessages: 0,
      praises: 0,
      criticisms: 0,
      questions: 0,
      lastInteraction: Date.now(),
      interactionsSinceSynthesis: 0,
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
  addCoreBeliefs?: string[]; // Nuevas creencias fundamentales
  addMetaGoals?: string[]; // Nuevas metas de largo plazo
  emotionalTone?: "positive" | "negative" | "neutral";
  dominantEmotion?: string;
  currentActivity?: string; // "leyendo", "navegando", "conversando"
  skillUpdates?: Partial<CubeSkills>; // Ajustes a habilidades (+/-0.05 típico)
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
    | "learning"
    | "casual";
  messageText?: string; // Texto del mensaje para working memory
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

  // ────────────────────────────────────────────────────────────────
  // CAPA 1: Working Memory
  // ────────────────────────────────────────────────────────────────
  if (update.messageText) {
    memory.workingMemory.recentMessages.push(update.messageText);
    if (memory.workingMemory.recentMessages.length > 5) {
      memory.workingMemory.recentMessages =
        memory.workingMemory.recentMessages.slice(-5);
    }
  }

  if (update.dominantEmotion) {
    memory.workingMemory.currentEmotion = update.dominantEmotion;
  }

  if (update.currentActivity) {
    memory.workingMemory.lastActivity = update.currentActivity;
  }

  // ────────────────────────────────────────────────────────────────
  // CAPA 2: Episodic Memory
  // ────────────────────────────────────────────────────────────────
  // Crear episodio si es importante
  if (
    update.intent &&
    [
      "praise",
      "criticism",
      "instruction",
      "emotion_sharing",
      "philosophy",
      "learning",
    ].includes(update.intent)
  ) {
    const episode: MemoryEpisode = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type:
        update.intent === "praise" || update.intent === "criticism"
          ? "emotional"
          : update.intent === "instruction"
            ? "learning"
            : "conversation",
      summary: update.messageText || `Interacción tipo ${update.intent}`,
      emotionalImpact: update.emotionalTone,
      keywords: update.messageText
        ? update.messageText.split(" ").slice(0, 5)
        : [],
    };

    memory.episodes.push(episode);

    // Mantener solo últimos 50 episodios
    if (memory.episodes.length > 50) {
      memory.episodes = memory.episodes.slice(-50);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // CAPA 3: Core/Identity
  // ────────────────────────────────────────────────────────────────

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

  // Actualizar creencias core (evitar duplicados, limitar a últimas 10)
  if (update.addCoreBeliefs && update.addCoreBeliefs.length > 0) {
    update.addCoreBeliefs.forEach((belief) => {
      if (!memory.coreBeliefs.includes(belief)) {
        memory.coreBeliefs.push(belief);
      }
    });
    if (memory.coreBeliefs.length > 10) {
      memory.coreBeliefs = memory.coreBeliefs.slice(-10);
    }
  }

  // Actualizar meta-goals (evitar duplicados, limitar a últimas 5)
  if (update.addMetaGoals && update.addMetaGoals.length > 0) {
    update.addMetaGoals.forEach((goal) => {
      if (!memory.metaGoals.includes(goal)) {
        memory.metaGoals.push(goal);
      }
    });
    if (memory.metaGoals.length > 5) {
      memory.metaGoals = memory.metaGoals.slice(-5);
    }
  }
  // POC: desactivar actualización de coreBeliefs/metaGoals (identidad básica solamente)

  // ────────────────────────────────────────────────────────────────
  // SKILLS (Habilidades numéricas)
  // ────────────────────────────────────────────────────────────────
  if (update.skillUpdates) {
    Object.keys(update.skillUpdates).forEach((key) => {
      const skillKey = key as keyof CubeSkills;
      const change = update.skillUpdates![skillKey];
      if (change !== undefined) {
        memory.skills[skillKey] = Math.max(
          0,
          Math.min(1, memory.skills[skillKey] + change)
        );
      }
    });
  }

  // ────────────────────────────────────────────────────────────────
  // ESTADO EMOCIONAL
  // ────────────────────────────────────────────────────────────────
  if (update.emotionalTone) {
    memory.emotionalState.lastInteractionTone = update.emotionalTone;
  }
  if (update.dominantEmotion) {
    memory.emotionalState.dominantEmotion = update.dominantEmotion;
  }

  // ────────────────────────────────────────────────────────────────
  // ESTADÍSTICAS DE CONVERSACIÓN
  // ────────────────────────────────────────────────────────────────
  memory.conversationStats.totalMessages += 1;
  memory.conversationStats.lastInteraction = Date.now();
  memory.conversationStats.interactionsSinceSynthesis += 1;

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

  // ────────────────────────────────────────────────────────────────
  // CAPA 1: MEMORIA DE TRABAJO (Short-term)
  // ────────────────────────────────────────────────────────────────
  lines.push("Memoria de trabajo (últimos minutos):");
  if (memory.workingMemory.recentMessages.length > 0) {
    lines.push(
      `- Últimos mensajes: ${memory.workingMemory.recentMessages.slice(-3).join(", ")}`
    );
  }
  lines.push(`- Emoción actual: ${memory.workingMemory.currentEmotion}`);
  lines.push(`- Actividad actual: ${memory.workingMemory.lastActivity}`);
  lines.push("");

  // ────────────────────────────────────────────────────────────────
  // CAPA 3: CORE/IDENTIDAD (Long-term) - Mostrar primero para contexto
  // ────────────────────────────────────────────────────────────────
  if (memory.coreBeliefs.length > 0) {
    lines.push("Creencias fundamentales (core):");
    memory.coreBeliefs.forEach((belief) => {
      lines.push(`- ${belief}`);
    });
    lines.push("");
  }

  if (memory.metaGoals.length > 0) {
    lines.push("Metas de largo plazo:");
    memory.metaGoals.forEach((goal) => {
      lines.push(`- ${goal}`);
    });
    lines.push("");
  }

  if (memory.philosophyStatement) {
    lines.push(`Filosofía personal: "${memory.philosophyStatement}"`);
    lines.push("");
  }

  // Rasgos actuales
  if (memory.traits.length > 0) {
    lines.push("Rasgos de personalidad:");
    memory.traits.slice(-5).forEach((trait) => {
      lines.push(`- ${trait}`);
    });
    lines.push("");
  }

  // Hechos importantes
  if (memory.facts.length > 0) {
    lines.push("Hechos importantes:");
    memory.facts.slice(-5).forEach((fact) => {
      lines.push(`- ${fact}`);
    });
    lines.push("");
  }

  // Preferencias del jugador
  if (memory.preferences.length > 0) {
    lines.push("Preferencias del jugador:");
    memory.preferences.slice(-5).forEach((pref) => {
      lines.push(`- ${pref}`);
    });
    lines.push("");
  }

  // ────────────────────────────────────────────────────────────────
  // HABILIDADES (Skills numéricas)
  // ────────────────────────────────────────────────────────────────
  lines.push("Habilidades:");
  lines.push(`- Social: ${(memory.skills.social * 100).toFixed(0)}%`);
  lines.push(`- Empatía: ${(memory.skills.empathy * 100).toFixed(0)}%`);
  lines.push(
    `- Asertividad: ${(memory.skills.assertiveness * 100).toFixed(0)}%`
  );
  lines.push(`- Curiosidad: ${(memory.skills.curiosity * 100).toFixed(0)}%`);
  lines.push(`- Creatividad: ${(memory.skills.creativity * 100).toFixed(0)}%`);
  lines.push(`- Lógica: ${(memory.skills.logic * 100).toFixed(0)}%`);
  lines.push("");

  // ────────────────────────────────────────────────────────────────
  // METAS ACTIVAS
  // ────────────────────────────────────────────────────────────────
  const activeGoals = memory.activeGoals.filter((g) => g.status === "active");
  if (activeGoals.length > 0) {
    lines.push("Metas activas:");
    activeGoals.forEach((goal) => {
      const progressPercent = (goal.progress * 100).toFixed(0);
      lines.push(`- ${goal.description} (${progressPercent}%)`);
    });
    lines.push("");
  }

  // ────────────────────────────────────────────────────────────────
  // EPISODIOS RECIENTES (Últimos 3)
  // ────────────────────────────────────────────────────────────────
  if (memory.episodes.length > 0) {
    lines.push("Episodios recientes:");
    memory.episodes.slice(-3).forEach((ep) => {
      const timeAgo = Math.floor((Date.now() - ep.timestamp) / 1000 / 60);
      lines.push(`- [Hace ${timeAgo}m] ${ep.summary}`);
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

  // POC: prompt mínimo (solo estado inmediato + skills + últimos episodios)
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
    | "learning"
    | "casual"
): MemoryUpdate {
  const update: MemoryUpdate = { intent };

  // Extraer preferencias del jugador
  if (intent === "preference") {
    const prefMatches = message.match(
      /me gusta (.+)|prefiero (.+)|me encanta (.+)/i
    );
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
