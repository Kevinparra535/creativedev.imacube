/**
 * ai.config.ts
 *
 * Configuración centralizada para IA local (Ollama).
 * Lee variables de entorno y proporciona valores por defecto.
 */

export interface AIConfig {
  localUrl: string; // e.g., http://localhost:3001/api/chat
  localModel: string; // e.g., llama3.1
}

/**
 * Obtiene la configuración de IA local desde variables de entorno
 */
export function getAIConfig(): AIConfig {
  return {
    localUrl:
      import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:3001/api/chat",
    localModel: import.meta.env.VITE_LOCAL_AI_MODEL || "llama3.1",
  };
}

/**
 * Verifica si IA local está configurada (siempre true ya que usa valores por defecto)
 */
export function isAIConfigured(): boolean {
  return true; // local backend siempre disponible con defaults
}
