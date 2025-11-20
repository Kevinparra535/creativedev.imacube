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
} from "./CubeMemory.service";
import { deriveNPCActions, applyNPCActions } from "./NPCInteractionBridge.service";
import { buildWorldKnowledgeContext } from "../data/worldKnowledge";
import { getArchetypeForPersonality, getModelNameForArchetype } from "../config/npcArchetypes";

// ────────────────────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────────────────────

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  backend?: "openai" | "local";
  localUrl?: string;
  localModel?: string;
}

export interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIResponse {
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
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

export class OpenAIService {
  private config: OpenAIConfig;
  private conversationHistory: Map<string, ConversationMessage[]>;
  private readonly MAX_HISTORY = 10; // Últimos 10 mensajes

  constructor(config: OpenAIConfig) {
    this.config = {
      model: "gpt-4o-mini",
      maxTokens: 150,
      temperature: 0.8,
      backend: "openai",
      localUrl: "http://localhost:3001/api/chat",
      localModel: "llama3.1",
      ...config,
    };
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
   * Genera una respuesta usando OpenAI o backend local con memoria dinámica
   */
  async generateResponse(
    cubeId: string,
    message: string,
    personality: Personality,
    cubeName: string,
    intent?: MessageIntent,
    concepts?: ExtractedConcepts
  ): Promise<OpenAIResponse> {
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

      let aiResponse: string | undefined;
      let usageData:
        | {
            prompt_tokens?: number;
            completion_tokens?: number;
            total_tokens?: number;
          }
        | undefined;

      if (this.config.backend === "local") {
        // Selección dinámica de modelo local según personalidad/arquetipo
        const archetype = getArchetypeForPersonality(personality);
        const chosenModel = getModelNameForArchetype(archetype);
        // Usar servidor local (Ollama/backend propio)
        const response = await fetch(this.config.localUrl!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: this.conversationHistory.get(cubeId),
            model: chosenModel || this.config.localModel,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error del backend local: ${text}`);
        }

        const data = await response.json();
        // Intentar extraer texto desde varias claves comunes
        aiResponse =
          (typeof data === "string" ? data : undefined) ||
          data?.response?.trim?.() ||
          data?.reply?.trim?.() ||
          data?.message?.trim?.() ||
          data?.text?.trim?.();

        if (!aiResponse) {
          throw new Error("Respuesta vacía del backend local");
        }
      } else {
        // Llamar a OpenAI API
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
              model: this.config.model,
              messages: this.conversationHistory.get(cubeId),
              max_tokens: this.config.maxTokens,
              temperature: this.config.temperature,
              top_p: 1,
              frequency_penalty: 0.5,
              presence_penalty: 0.3,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Error en la API de OpenAI");
        }

        const data = await response.json();
        aiResponse = data.choices[0]?.message?.content?.trim();

        if (!aiResponse) {
          throw new Error("Respuesta vacía de OpenAI");
        }
        usageData = data.usage;
      }

      // Agregar respuesta del asistente al historial
      this.conversationHistory.get(cubeId)!.push({ role: "assistant", content: aiResponse });

      // Derivar acciones expresivas / físicas (bridge)
      try {
        const actions = deriveNPCActions(aiResponse, memory || undefined);
        applyNPCActions(cubeId, actions);
      } catch (bridgeErr) {
        console.warn("NPCInteractionBridge error:", bridgeErr);
      }

      return {
        success: true,
        response: aiResponse,
        // Nota: uso de tokens solo disponible en OpenAI; en local omitimos métricas
        usage: usageData
          ? {
              promptTokens: usageData.prompt_tokens || 0,
              completionTokens: usageData.completion_tokens || 0,
              totalTokens: usageData.total_tokens || 0,
            }
          : undefined,
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

  /**
   * Actualiza la API key
   */
  updateApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// ────────────────────────────────────────────────────────────────
// INSTANCIA SINGLETON
// ────────────────────────────────────────────────────────────────

let openAIServiceInstance: OpenAIService | null = null;

/**
 * Inicializa el servicio de OpenAI (llamar al inicio de la app)
 */
export function initializeOpenAI(
  apiKey: string,
  config?: Partial<OpenAIConfig>
): OpenAIService {
  openAIServiceInstance = new OpenAIService({ apiKey, ...config });
  return openAIServiceInstance;
}

/**
 * Obtiene la instancia del servicio (debe haberse inicializado primero)
 */
export function getOpenAIService(): OpenAIService {
  if (!openAIServiceInstance) {
    throw new Error(
      "OpenAIService no inicializado. Llama a initializeOpenAI() primero."
    );
  }
  return openAIServiceInstance;
}

/**
 * Verifica si el servicio está inicializado
 */
export function isOpenAIInitialized(): boolean {
  return openAIServiceInstance !== null;
}
