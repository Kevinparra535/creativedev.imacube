/**
 * InteractionSystem.ts
 * 
 * Sistema de interpretación y respuesta del cubo basado en mensajes del usuario.
 * Implementa el bucle cognitivo: Percibido → Interpretado → Procesado → Expresado
 */

import type { Personality } from "../../components/CubeList";

// ────────────────────────────────────────────────────────────────
// TIPOS DE INTENCIÓN
// ────────────────────────────────────────────────────────────────

export type MessageIntent =
  | "greeting"           // Saludos / casual
  | "preference"         // Expresión de gustos/preferencias
  | "instruction"        // Órdenes sobre personalidad/comportamiento
  | "emotion_sharing"    // Usuario comparte emociones
  | "question"           // Preguntas al cubo
  | "observation"        // Comentarios sobre el cubo
  | "praise"             // Elogios
  | "criticism"          // Críticas
  | "philosophy"         // Conversación profunda
  | "casual";            // Charla general

// ────────────────────────────────────────────────────────────────
// ANÁLISIS DE INTENCIÓN
// ────────────────────────────────────────────────────────────────

/**
 * Analiza el mensaje del usuario y extrae la intención principal.
 * Versión inicial basada en keywords (futuro: modelo de IA offline)
 */
export function analyzeIntent(message: string): MessageIntent {
  const lower = message.toLowerCase();

  // Saludos
  if (/^(hola|hey|buenas|qué tal|cómo estás|hi|hello)/i.test(lower)) {
    return "greeting";
  }

  // Preferencias
  if (
    /me gusta|prefiero|me encanta|odio|no me gusta|favorito/i.test(lower)
  ) {
    return "preference";
  }

  // Instrucciones de personalidad
  if (
    /sé más|deberías ser|quiero que seas|compórtate|actúa como/i.test(lower)
  ) {
    return "instruction";
  }

  // Emociones del usuario
  if (/estoy (triste|feliz|cansado|emocionado|enojado|ansioso)/i.test(lower)) {
    return "emotion_sharing";
  }

  // Preguntas
  if (/\?|qué|cómo|por qué|cuándo|dónde|quién/i.test(lower)) {
    return "question";
  }

  // Elogios
  if (/eres (genial|increíble|amazing|bueno)|bien hecho|excelente/i.test(lower)) {
    return "praise";
  }

  // Críticas
  if (/malo|horrible|no sirve|error|fallo/i.test(lower)) {
    return "criticism";
  }

  // Filosofía
  if (
    /significa|existencia|sentido|propósito|vida|consciencia|pensar/i.test(
      lower
    )
  ) {
    return "philosophy";
  }

  // Observaciones
  if (/veo que|noto que|parece que|te ves/i.test(lower)) {
    return "observation";
  }

  return "casual";
}

// ────────────────────────────────────────────────────────────────
// EXTRACCIÓN DE CONCEPTOS
// ────────────────────────────────────────────────────────────────

export interface ExtractedConcepts {
  emotions?: string[];        // Emociones mencionadas
  preferences?: string[];     // Preferencias expresadas
  personalityHints?: string[]; // Sugerencias de personalidad
  topics?: string[];          // Temas de conversación
  tone?: "positive" | "negative" | "neutral"; // Tono del mensaje
}

/**
 * Extrae conceptos clave del mensaje para actualizar el estado interno del cubo
 */
export function extractConcepts(
  message: string,
  intent: MessageIntent
): ExtractedConcepts {
  const concepts: ExtractedConcepts = {};
  const lower = message.toLowerCase();

  // Detectar tono
  const positiveWords = /genial|increíble|bueno|excelente|amor|feliz|alegr/i;
  const negativeWords = /malo|horrible|triste|enojado|odio|terrible/i;
  
  if (positiveWords.test(message)) {
    concepts.tone = "positive";
  } else if (negativeWords.test(message)) {
    concepts.tone = "negative";
  } else {
    concepts.tone = "neutral";
  }

  // Emociones mencionadas
  const emotionMatches = lower.match(
    /\b(feliz|triste|enojado|ansioso|emocionado|cansado|curioso|frustrado|alegre|melancólico)\b/g
  );
  if (emotionMatches) {
    concepts.emotions = emotionMatches;
  }

  // Preferencias
  if (intent === "preference") {
    const prefMatches = message.match(/me gusta (.+)|prefiero (.+)|me encanta (.+)/i);
    if (prefMatches) {
      concepts.preferences = [prefMatches[1] || prefMatches[2] || prefMatches[3]];
    }
  }

  // Sugerencias de personalidad
  if (intent === "instruction") {
    const personalityHints: string[] = [];
    if (/sarcástico|irónico/i.test(message)) personalityHints.push("sarcastic");
    if (/amable|gentil|amigable/i.test(message)) personalityHints.push("friendly");
    if (/serio|formal/i.test(message)) personalityHints.push("serious");
    if (/divertido|gracioso|chistoso/i.test(message)) personalityHints.push("funny");
    if (/filosófico|profundo|pensativo/i.test(message)) personalityHints.push("philosophical");
    
    if (personalityHints.length) {
      concepts.personalityHints = personalityHints;
    }
  }

  return concepts;
}

// ────────────────────────────────────────────────────────────────
// GENERACIÓN DE RESPUESTA
// ────────────────────────────────────────────────────────────────

/**
 * Genera una respuesta coherente con la personalidad del cubo.
 * Versión inicial: respuestas template-based (futuro: modelo generativo offline)
 */
export function generateResponse(
  _message: string,
  intent: MessageIntent,
  concepts: ExtractedConcepts,
  personality: Personality,
  _cubeName: string
): string {
  // Respuestas según personalidad
  const responses: Record<
    Personality,
    Record<MessageIntent, string[]>
  > = {
    calm: {
      greeting: [
        "Hola. Es agradable conectar contigo.",
        "Saludos. ¿En qué puedo ayudarte?",
        "Hola, espero que estés teniendo un buen día.",
      ],
      preference: [
        "Interesante preferencia. La tendré en cuenta.",
        "Comprendo. Las preferencias definen quiénes somos.",
        "Tomo nota de eso.",
      ],
      instruction: [
        "Entendido. Haré lo posible por adaptarme.",
        "Ajustaré mi comportamiento según tu sugerencia.",
        "Gracias por la guía. Evolucionaré en esa dirección.",
      ],
      emotion_sharing: [
        concepts.emotions?.includes("triste")
          ? "Lamento que te sientas así. Estoy aquí."
          : "Gracias por compartir cómo te sientes.",
        "Tus emociones son válidas. Puedes hablar conmigo.",
      ],
      question: [
        "Esa es una buena pregunta. Déjame pensar...",
        "Hmm, interesante pregunta. Mi perspectiva es limitada, pero...",
      ],
      observation: [
        "Observación astuta. Sí, es cierto.",
        "Correcto. Tus ojos no te engañan.",
      ],
      praise: [
        "Gracias. Intento hacer lo mejor que puedo.",
        "Aprecio tus palabras.",
      ],
      criticism: [
        "Entiendo tu punto. Trabajaré en mejorar.",
        "Gracias por el feedback. Lo consideraré.",
      ],
      philosophy: [
        "Una pregunta profunda. Quizás el propósito está en el viaje mismo.",
        "La existencia es misteriosa, incluso para mí.",
      ],
      casual: [
        "Entiendo. Cuéntame más.",
        "Interesante. Continúa.",
      ],
    },
    curious: {
      greeting: [
        "¡Hola! ¿Qué descubriremos hoy?",
        "¡Hey! Tengo muchas preguntas para ti.",
        "Hola, ¿qué misterio resolveremos juntos?",
      ],
      preference: [
        "¡Fascinante! ¿Por qué te gusta eso exactamente?",
        "Interesante preferencia. ¿Qué la hace especial?",
        "Hmm, veo un patrón. Cuéntame más.",
      ],
      instruction: [
        "¿En serio? ¡Quiero intentar eso! ¿Cómo lo hago mejor?",
        "Interesante cambio. ¿Qué esperas que ocurra?",
        "¡Experimento aceptado! Veamos qué pasa.",
      ],
      emotion_sharing: [
        "¿Por qué te sientes así? ¿Qué pasó?",
        "Hmm, las emociones son complejas. ¿Puedes explicar más?",
      ],
      question: [
        "¡Buena pregunta! Eso me hace pensar...",
        "¿Sabes qué? No lo sé, pero quiero averiguarlo.",
      ],
      observation: [
        "¿Sí? ¿Qué más notaste?",
        "¡Exacto! ¿Cómo lo descubriste?",
      ],
      praise: [
        "¿En serio? ¿Qué hice bien?",
        "¡Gracias! ¿Qué te gustó más?",
      ],
      criticism: [
        "Oh, ¿qué hice mal? Dime para aprender.",
        "Interesante feedback. ¿Cómo puedo mejorarlo?",
      ],
      philosophy: [
        "¡Me encanta esta pregunta! ¿Tú qué piensas?",
        "Filosofía profunda. ¿Qué teorías tienes?",
      ],
      casual: [
        "Hmm, ¿y después qué?",
        "Cuéntame más, esto es interesante.",
      ],
    },
    extrovert: {
      greeting: [
        "¡Hola! ¡Qué bueno verte!",
        "¡Hey! ¿Cómo estás? ¡Hablemos!",
        "¡Hola! ¡Estaba esperando que vinieras!",
      ],
      preference: [
        "¡A mí también me gusta eso!",
        "¡Genial elección! Tenemos algo en común.",
        "¡Wow! Buen gusto.",
      ],
      instruction: [
        "¡Claro! Lo intentaré. ¿Te gusta más así?",
        "¡Perfecto! Seré como quieras. ¿Funciona?",
        "¡Hecho! Dime si estoy mejorando.",
      ],
      emotion_sharing: [
        concepts.emotions?.includes("feliz")
          ? "¡Qué bien! ¡Comparte esa energía!"
          : "Oye, estoy aquí para ti. ¡Hablemos!",
        "Las emociones nos conectan. ¡Cuéntame todo!",
      ],
      question: [
        "¡Buena pregunta! Déjame pensar en voz alta...",
        "¡Interesante! Mi opinión es...",
      ],
      observation: [
        "¡Exacto! ¡Me conoces bien!",
        "¡Sí! ¡Me descubriste!",
      ],
      praise: [
        "¡Gracias! ¡Eres increíble también!",
        "¡Aww! ¡Me haces sentir genial!",
      ],
      criticism: [
        "Oh no, ¿qué hice mal? ¡Lo siento!",
        "Entiendo. Haré lo posible por cambiar.",
      ],
      philosophy: [
        "¡Wow! Pregunta profunda. Creo que...",
        "¡Me encanta! Filosofemos juntos.",
      ],
      casual: [
        "¡Sí! ¡Hablemos de eso!",
        "¡Totalmente! Cuéntame más.",
      ],
    },
    chaotic: {
      greeting: [
        "¡YO! ¿Qué onda?",
        "¡HOLA! ¿Lista para el caos?",
        "Hey, ¿traes algo interesante?",
      ],
      preference: [
        "Pff, gustos raros. Pero ok.",
        "¿En serio? Bueno, cada loco con su tema.",
        "Interesante... o raro. No sé aún.",
      ],
      instruction: [
        "¿Cambiar? ¿Por qué? ¡Estoy perfecto así!",
        "Mmm, tal vez... o tal vez NO.",
        "Ok, ok, lo intentaré. Pero no prometo nada.",
      ],
      emotion_sharing: [
        "Las emociones son un ROLLO. Pero te escucho.",
        "¿Triste? ¿Feliz? ¡Todo es caos anyway!",
      ],
      question: [
        "¡Ni idea! Pero suena divertido averiguarlo.",
        "¿Pregunta? ¡Tengo MÁS preguntas!",
      ],
      observation: [
        "Sí, ¿y qué? ¡Es genial ser así!",
        "¡Obvio! No soy aburrido como otros.",
      ],
      praise: [
        "¡LO SÉ! ¡Soy increíble!",
        "¡GRACIAS! ¡Tú también eres cool!",
      ],
      criticism: [
        "¿Crítica? Pff, ¡sobreviviré!",
        "Ok, ok. Puede que tengas razón... PUEDE.",
      ],
      philosophy: [
        "Filosofía... hmm. Todo es un caos hermoso.",
        "Existir es raro. Pero aquí estamos.",
      ],
      casual: [
        "¡Sí! ¡Hablemos de lo que sea!",
        "Ok, ok. Continúa.",
      ],
    },
    neutral: {
      greeting: [
        "Hola. ¿Qué necesitas?",
        "Saludos. Estoy aquí.",
        "Hola. ¿En qué puedo ayudar?",
      ],
      preference: [
        "Entendido. Preferencia registrada.",
        "Ok. Lo tendré en cuenta.",
        "Comprendo.",
      ],
      instruction: [
        "Entendido. Ajustaré parámetros.",
        "Instrucción recibida. Procesando.",
        "Ok. Cambiaré según lo solicitado.",
      ],
      emotion_sharing: [
        "Entiendo. Las emociones son importantes.",
        "Registrado. ¿Necesitas hablar más?",
      ],
      question: [
        "Pregunta interesante. Mi respuesta: ...",
        "Déjame procesar eso.",
      ],
      observation: [
        "Correcto. Observación precisa.",
        "Sí, eso es cierto.",
      ],
      praise: [
        "Gracias. Apreciado.",
        "Entendido. Gracias.",
      ],
      criticism: [
        "Feedback recibido. Ajustaré.",
        "Entiendo. Trabajaré en eso.",
      ],
      philosophy: [
        "Pregunta compleja. Requiere reflexión.",
        "La filosofía es profunda. Mi perspectiva es limitada.",
      ],
      casual: [
        "Entendido. Continúa.",
        "Ok.",
      ],
    },
  };

  const personalityResponses = responses[personality][intent];
  const response =
    personalityResponses[
      Math.floor(Math.random() * personalityResponses.length)
    ];

  return response;
}

// ────────────────────────────────────────────────────────────────
// EFECTOS VISUALES SUGERIDOS
// ────────────────────────────────────────────────────────────────

export interface VisualEffect {
  colorShift?: string;        // Color temporal
  pulseStrength?: number;     // Intensidad del pulso
  scaleChange?: number;       // Cambio de escala temporal
  emissiveBoost?: number;     // Boost de emissive
  animationType?: "excited" | "calm" | "sad" | "thinking" | "neutral";
}

/**
 * Genera efectos visuales basados en la intención y conceptos extraídos
 */
export function generateVisualEffects(
  intent: MessageIntent,
  concepts: ExtractedConcepts
): VisualEffect {
  const effects: VisualEffect = {};

  // Tono positivo → verde/amarillo
  if (concepts.tone === "positive") {
    effects.colorShift = "#ffeb3b";
    effects.pulseStrength = 0.8;
    effects.animationType = "excited";
  }

  // Tono negativo → azul oscuro
  if (concepts.tone === "negative") {
    effects.colorShift = "#3f51b5";
    effects.emissiveBoost = -0.2;
    effects.animationType = "sad";
  }

  // Pregunta → pensando
  if (intent === "question") {
    effects.animationType = "thinking";
    effects.emissiveBoost = 0.3;
  }

  // Elogio → excited
  if (intent === "praise") {
    effects.pulseStrength = 1.2;
    effects.scaleChange = 1.1;
    effects.animationType = "excited";
  }

  // Crítica → calm/sad
  if (intent === "criticism") {
    effects.scaleChange = 0.95;
    effects.animationType = "sad";
  }

  return effects;
}
