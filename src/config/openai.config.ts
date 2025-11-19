/**
 * openai.config.ts
 *
 * Configuración centralizada para OpenAI.
 * Lee variables de entorno y proporciona valores por defecto.
 */

export interface OpenAIEnvironmentConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/**
 * Obtiene la configuración de OpenAI desde variables de entorno
 */
export function getOpenAIConfig(): OpenAIEnvironmentConfig {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";

  if (!apiKey) {
    console.warn(
      "⚠️ VITE_OPENAI_API_KEY no configurada. El sistema usará respuestas template-based."
    );
  }

  return {
    apiKey,
    model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || "150", 10),
    temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || "0.8"),
  };
}

/**
 * Verifica si OpenAI está configurado correctamente
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY);
}
