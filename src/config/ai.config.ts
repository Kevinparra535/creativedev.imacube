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
  // Backend selection: 'openai' uses OpenAI API, 'local' uses local server
  backend: "openai" | "local";
  // Local backend settings (used when backend = 'local')
  localUrl: string; // e.g., http://localhost:3001/api/chat
  localModel: string; // e.g., llama3.1
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

  // Default to 'local' since we no longer use OpenAI by default
  const backend = (import.meta.env.VITE_AI_BACKEND || "local").toLowerCase();

  return {
    apiKey,
    model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || "150", 10),
    temperature: parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || "0.8"),
    backend: backend === "local" ? "local" : "openai",
    localUrl:
      import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:3001/api/chat",
    localModel: import.meta.env.VITE_LOCAL_AI_MODEL || "llama3.1",
  };
}

/**
 * Verifica si OpenAI está configurado correctamente
 */
export function isOpenAIConfigured(): boolean {
  const backend = (import.meta.env.VITE_AI_BACKEND || "openai").toLowerCase();
  if (backend === "local") return true; // local backend does not require API key
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY);
}
