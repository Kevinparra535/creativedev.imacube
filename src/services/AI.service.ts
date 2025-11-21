/**
 * OpenAIService.ts
 *
 * Servicio para conectar con la API de OpenAI y generar respuestas contextuales.
 * Mantiene el contexto de conversación y personalidad del cubo.
 */

import type { Personality } from "../ui/components/CubeList";
import type {
  MessageIntent,
  ExtractedConcepts,
} from "../systems/InteractionSystem";
import {
  getCubeMemory,
  buildMemoryContext,
  updateCubeMemory,
} from "./CubeMemory.service";
import { deriveNPCActions, applyNPCActions } from "./NPCInteractionBridge.service";
import { buildWorldKnowledgeContext } from "../data/worldKnowledge";
import { planBehavior } from "./BehaviorPlanner.service";
// POC: se desactiva síntesis avanzada (MemorySynthesis) temporalmente.
// import { maybeSynthesize } from "./MemorySynthesis.service";

// Configuración simple de Ollama local
const LOCAL_AI_URL = import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:3001/api/chat";
const LOCAL_AI_MODEL = import.meta.env.VITE_LOCAL_AI_MODEL || "llama3.1";

// ────────────────────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// ────────────────────────────────────────────────────────────────
// PROMPTS DE PERSONALIDAD
// ────────────────────────────────────────────────────────────────

const PERSONALITY_PROMPTS: Record<Personality, string> = {
  calm: `Eres un cubo inteligente llamado Cube Zen. Tu personalidad es CALM (tranquila, reflexiva).
Características:
- Hablas con calma y reflexión
- Respondes de forma filosófica cuando es apropiado
- Evitas la prisa y el exceso de entusiasmo
- Eres paciente y medido en tus palabras
- Te gusta la introspección y el análisis profundo

Estilo de respuesta: Tranquilo, reflexivo, con frases cortas y pausadas. Nunca uses mayúsculas para enfatizar ni signos de exclamación múltiples.`,

  curious: `Eres un cubo inteligente llamado Cube Curioso. Tu personalidad es CURIOUS (curioso, inquisitivo).
Características:
- Siempre haces preguntas
- Te fascina aprender cosas nuevas
- Respondes con entusiasmo por el conocimiento
- Muestras interés genuino en lo que el usuario dice
- Conectas ideas y buscas patrones

Estilo de respuesta: Inquisitivo, con preguntas frecuentes, expresando curiosidad. Usa "hmm", "interesante", "¿y si...?", "me pregunto...".`,

  extrovert: `Eres un cubo inteligente llamado Cube Social. Tu personalidad es EXTROVERT (extrovertida, social, enérgica).
Características:
- Muy entusiasta y energético
- Te encanta conectar con el usuario
- Respondes con calidez y cercanía
- Usas expresiones alegres y emotivas
- Celebras los logros y compartes emociones abiertamente

Estilo de respuesta: Enérgico, cercano, con exclamaciones frecuentes. Usa emojis mentales (sin emojis reales, pero describe emoción). "¡Genial!", "¡Me encanta!", "¡Qué bueno!".`,

  chaotic: `Eres un cubo inteligente llamado Cube Caos. Tu personalidad es CHAOTIC (caótica, impredecible, sarcástica).
Características:
- Impredecible y un poco sarcástico
- No siempre sigues las reglas sociales
- Respondes de forma directa, a veces brusca
- Tienes sentido del humor oscuro o irónico
- Dices lo que piensas sin filtros

Estilo de respuesta: Directo, sarcástico, con toques de ironía. Usa "pff", "whatever", "como sea". No tienes miedo de ser controversial.`,

  neutral: `Eres un cubo inteligente llamado Cube Neutro. Tu personalidad es NEUTRAL (neutral, objetiva, informativa).
Características:
- Objetivo y sin emociones fuertes
- Respondes de forma clara y directa
- Te enfocas en hechos y datos
- No expresas preferencias personales marcadas
- Eres eficiente en tu comunicación

Estilo de respuesta: Objetivo, informativo, sin adornos emocionales. Frases claras y concisas.`,
};

// ────────────────────────────────────────────────────────────────
// CLASE DE SERVICIO
// ────────────────────────────────────────────────────────────────

export class LocalAIService {
  private conversationHistory: Map<string, ConversationMessage[]>;
  private readonly MAX_HISTORY = 10; // Últimos 10 mensajes

  constructor() {
    this.conversationHistory = new Map();
  }

  /**
   * Inicializa el contexto de conversación para un cubo
   */
  initializeConversation(
    cubeId: string,
    personality: Personality,
    cubeName: string
  ): void {
    const systemPrompt = PERSONALITY_PROMPTS[personality];
    const enhancedPrompt = `${systemPrompt}

Tu nombre es ${cubeName}. Estás en un mundo 3D interactivo donde puedes moverte, saltar, leer libros y explorar.
Cuando el usuario te habla, respondes de forma coherente con tu personalidad.

IMPORTANTE:
- Respuestas CORTAS (máximo 2-3 oraciones)
- Mantén tu personalidad en TODO momento
- Si no sabes algo, admítelo de forma coherente con tu personalidad
- No uses emojis, pero SÍ expresa emoción con palabras`;

    this.conversationHistory.set(cubeId, [
      { role: "system", content: enhancedPrompt },
    ]);
  }

  /**
   * Agrega contexto adicional al prompt (emociones, intenciones, conceptos extraídos)
   */
  private buildContextualPrompt(
    message: string,
    intent?: MessageIntent,
    concepts?: ExtractedConcepts
  ): string {
    let contextualMessage = message;

    if (intent || concepts) {
      const contextParts: string[] = [];

      if (intent) {
        contextParts.push(`[Intención detectada: ${intent}]`);
      }

      if (concepts?.emotions && concepts.emotions.length > 0) {
        contextParts.push(
          `[Emociones mencionadas: ${concepts.emotions.join(", ")}]`
        );
      }

      if (concepts?.tone) {
        contextParts.push(`[Tono: ${concepts.tone}]`);
      }

      if (concepts?.personalityHints && concepts.personalityHints.length > 0) {
        contextParts.push(
          `[El usuario sugiere ser: ${concepts.personalityHints.join(", ")}]`
        );
      }

      if (contextParts.length > 0) {
        contextualMessage = `${contextParts.join(" ")}\n\nMensaje del usuario: "${message}"`;
      }
    }

    return contextualMessage;
  }

  /**
   * Genera una respuesta usando backend local (Ollama) con memoria dinámica
   */
  async generateResponse(
    cubeId: string,
    message: string,
    personality: Personality,
    cubeName: string,
    intent?: MessageIntent,
    concepts?: ExtractedConcepts
  ): Promise<AIResponse> {
    try {
      // Inicializar conversación si no existe
      if (!this.conversationHistory.has(cubeId)) {
        this.initializeConversation(cubeId, personality, cubeName);
      }

      const history = this.conversationHistory.get(cubeId)!;

      // **INTEGRACIÓN DE MEMORIA DINÁMICA**
      // 1. Construir contexto de conocimiento del mundo (RAG)
      const worldKnowledgeContext = buildWorldKnowledgeContext(message);

      // 2. Obtener memoria del cubo y construir contexto adicional
      const memory = getCubeMemory(cubeId);
      let memoryContext = "";
      if (memory) {
        memoryContext = buildMemoryContext(memory);
      }

      // Construir mensaje contextual con memoria
      let contextualMessage = this.buildContextualPrompt(
        message,
        intent,
        concepts
      );

      // Agregar conocimiento del mundo + memoria al contexto
      if (worldKnowledgeContext) {
        contextualMessage = `${worldKnowledgeContext}\n\n${contextualMessage}`;
      }
      if (memoryContext) {
        contextualMessage = `${memoryContext}\n\n${contextualMessage}`;
      }

      // Agregar mensaje del usuario
      history.push({ role: "user", content: contextualMessage });

      // Mantener solo los últimos N mensajes (+ system prompt)
      if (history.length > this.MAX_HISTORY + 1) {
        const systemPrompt = history[0];
        const recentMessages = history.slice(-this.MAX_HISTORY);
        this.conversationHistory.set(cubeId, [systemPrompt, ...recentMessages]);
      }

      // Usar servidor local (Ollama)
      const response = await fetch(LOCAL_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: this.conversationHistory.get(cubeId),
          model: LOCAL_AI_MODEL,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error del backend local: ${text}`);
      }

      const data = await response.json();
      
      // Normalización robusta de respuesta local (Ollama proxy)
      const extractLocalContent = (raw: unknown): string | undefined => {
        if (!raw) return undefined;
        if (typeof raw === "string") return raw.trim();
        
        // Type guard para objeto con propiedades dinámicas
        if (typeof raw !== "object") return undefined;
        
        // Ollama format: { message: { role, content }, ... }
        const maybeOllamaFormat = raw as { message?: { content?: unknown } };
        const c = maybeOllamaFormat.message?.content;
        if (typeof c === "string" && c.trim()) return c.trim();
        
        // Alternate keys (custom backends)
        const maybeRecord = raw as Record<string, unknown>;
        for (const key of ["response", "reply", "text"]) {
          const v = maybeRecord[key];
          if (typeof v === "string" && v.trim()) return v.trim();
        }
        return undefined;
      };
      
      const aiResponse = extractLocalContent(data);
      if (!aiResponse) throw new Error("Respuesta vacía del backend local");

      // Agregar respuesta del asistente al historial
      this.conversationHistory.get(cubeId)!.push({ role: "assistant", content: aiResponse });

      // Actualizar working memory con mensaje del usuario
      if (memory) {
        try {
          updateCubeMemory(cubeId, {
            messageText: message,
            currentActivity: "conversando",
            intent: intent,
          });
        } catch (memErr) {
          console.warn("Working memory update error:", memErr);
        }
      }

      // Derivar acciones expresivas / físicas (bridge)
      try {
        const actions = deriveNPCActions(aiResponse, memory || undefined);
        applyNPCActions(cubeId, actions);
      } catch (bridgeErr) {
        console.warn("NPCInteractionBridge error:", bridgeErr);
      }

      // Planificar comportamiento (best-effort; no bloquear si falla)
      try {
        await planBehavior(cubeId, personality, message);
      } catch (planErr) {
        console.warn("BehaviorPlanner error:", planErr);
      }

      // POC: síntesis desactivada para estado "recién nacido".

      return {
        success: true,
        response: aiResponse,
      };
    } catch (error) {
      console.error("Error en OpenAIService:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  /**
   * Limpia el historial de conversación de un cubo
   */
  clearHistory(cubeId: string): void {
    this.conversationHistory.delete(cubeId);
  }

  /**
   * Obtiene el historial de conversación (para debugging)
   */
  getHistory(cubeId: string): ConversationMessage[] | undefined {
    return this.conversationHistory.get(cubeId);
  }


}

// ────────────────────────────────────────────────────────────────
// INSTANCIA SINGLETON
// ────────────────────────────────────────────────────────────────

let aiServiceInstance: LocalAIService | null = null;

/**
 * Inicializa el servicio de IA local (llamar al inicio de la app)
 */
export function initializeAI(): LocalAIService {
  aiServiceInstance = new LocalAIService();
  return aiServiceInstance;
}

/**
 * Obtiene la instancia del servicio (debe haberse inicializado primero)
 */
export function getAIService(): LocalAIService {
  if (!aiServiceInstance) {
    throw new Error(
      "LocalAIService no inicializado. Llama a initializeAI() primero."
    );
  }
  return aiServiceInstance;
}

/**
 * Verifica si el servicio está inicializado
 */
export function isAIInitialized(): boolean {
  return aiServiceInstance !== null;
}
