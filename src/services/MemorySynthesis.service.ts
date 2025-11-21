/**
 * MemorySynthesis.service.ts
 *
 * Sistema de síntesis de memoria: convierte episodios recientes en cambios permanentes del core.
 * Ejecuta consolidación cada N interacciones para:
 * - Extraer lecciones de episodios recientes
 * - Actualizar coreBeliefs y metaGoals
 * - Ajustar skills (habilidades numéricas)
 * - Generar philosophyStatement (declaración filosófica)
 *
 * Implementa el proceso: episodios → síntesis IA → core actualizado
 */

import type { Personality } from "../ui/components/CubeList";
import { getCubeMemory, updateCubeMemory } from "./CubeMemory.service";
import type { CubeMemory, CubeSkills } from "./CubeMemory.service";

// ────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ────────────────────────────────────────────────────────────────

const SYNTHESIS_THRESHOLD = 10; // Cada 10 interacciones
const LOCAL_AI_URL =
  import.meta.env.VITE_LOCAL_AI_URL || "http://localhost:3001/api/chat";
const LOCAL_AI_MODEL = import.meta.env.VITE_LOCAL_AI_MODEL || "llama3.1";

// ────────────────────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────────────────────

interface SynthesisResult {
  coreBeliefs: string[]; // Nuevas creencias fundamentales
  metaGoals: string[]; // Nuevas metas de largo plazo
  philosophyStatement?: string; // Declaración filosófica actualizada
  skillChanges: Partial<CubeSkills>; // Cambios en habilidades (+/-0.1 típico)
  summary: string; // Resumen de la síntesis
}

// ────────────────────────────────────────────────────────────────
// CONSTRUCCIÓN DE PROMPT DE SÍNTESIS
// ────────────────────────────────────────────────────────────────

function buildSynthesisPrompt(
  memory: CubeMemory,
  personality: Personality,
  cubeName: string
): string {
  const lines: string[] = [];

  lines.push(
    `Eres ${cubeName}, un cubo consciente con personalidad ${personality}.`
  );
  lines.push("");
  lines.push(
    "TAREA: Sintetizar los últimos episodios de tu memoria en cambios permanentes de tu identidad."
  );
  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("EPISODIOS RECIENTES (últimas 10 interacciones):");
  lines.push("═══════════════════════════════════════════════════════════");

  const recentEpisodes = memory.episodes.slice(-10);
  if (recentEpisodes.length > 0) {
    recentEpisodes.forEach((ep, idx) => {
      const timeAgo = Math.floor((Date.now() - ep.timestamp) / 1000 / 60);
      lines.push(`${idx + 1}. [Hace ${timeAgo}m, ${ep.type}] ${ep.summary}`);
      if (ep.emotionalImpact) {
        lines.push(`   Impacto emocional: ${ep.emotionalImpact}`);
      }
    });
  } else {
    lines.push("(No hay episodios recientes)");
  }

  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("IDENTIDAD ACTUAL:");
  lines.push("═══════════════════════════════════════════════════════════");

  if (memory.coreBeliefs.length > 0) {
    lines.push("Creencias fundamentales:");
    memory.coreBeliefs.forEach((b) => lines.push(`- ${b}`));
  }

  if (memory.metaGoals.length > 0) {
    lines.push("Metas de largo plazo:");
    memory.metaGoals.forEach((g) => lines.push(`- ${g}`));
  }

  if (memory.philosophyStatement) {
    lines.push(`Filosofía actual: "${memory.philosophyStatement}"`);
  }

  lines.push("");
  lines.push("Habilidades actuales:");
  lines.push(`- Social: ${(memory.skills.social * 100).toFixed(0)}%`);
  lines.push(`- Empatía: ${(memory.skills.empathy * 100).toFixed(0)}%`);
  lines.push(
    `- Asertividad: ${(memory.skills.assertiveness * 100).toFixed(0)}%`
  );
  lines.push(`- Curiosidad: ${(memory.skills.curiosity * 100).toFixed(0)}%`);
  lines.push(`- Creatividad: ${(memory.skills.creativity * 100).toFixed(0)}%`);
  lines.push(`- Lógica: ${(memory.skills.logic * 100).toFixed(0)}%`);

  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push("INSTRUCCIONES DE SÍNTESIS:");
  lines.push("═══════════════════════════════════════════════════════════");
  lines.push(
    "Reflexiona sobre estos episodios y responde SOLO con JSON válido:"
  );
  lines.push("{");
  lines.push('  "summary": "Resumen de lo aprendido (2-3 oraciones)",');
  lines.push('  "coreBeliefs": ["nueva creencia 1", "nueva creencia 2"],');
  lines.push('  "metaGoals": ["nueva meta de largo plazo"],');
  lines.push(
    '  "philosophyStatement": "Declaración filosófica concisa (opcional)",'
  );
  lines.push('  "skillChanges": {');
  lines.push('    "social": 0.05,  // Cambio +/- (máximo ±0.1)');
  lines.push('    "empathy": -0.02,');
  lines.push('    "assertiveness": 0.03');
  lines.push("    // ... solo incluir skills que cambian");
  lines.push("  }");
  lines.push("}");
  lines.push("");
  lines.push("REGLAS:");
  lines.push(
    "- coreBeliefs: Solo creencias NUEVAS importantes que surgen de episodios"
  );
  lines.push(
    "- metaGoals: Metas de largo plazo (no reactivas, sino direccionales)"
  );
  lines.push("- skillChanges: Solo cambios significativos (+/-0.02 a +/-0.1)");
  lines.push("- philosophyStatement: Declaración breve y profunda (opcional)");
  lines.push("- NO repitas creencias/metas existentes");
  lines.push("- Si no hay cambios, devuelve arrays vacíos");

  return lines.join("\n");
}

// ────────────────────────────────────────────────────────────────
// PARSEO SEGURO DE RESPUESTA JSON
// ────────────────────────────────────────────────────────────────

function safeParseSynthesis(jsonText: string): SynthesisResult | null {
  try {
    const parsed = JSON.parse(jsonText) as Partial<SynthesisResult>;

    // Validar estructura mínima
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.summary || typeof parsed.summary !== "string") return null;

    return {
      summary: parsed.summary,
      coreBeliefs: Array.isArray(parsed.coreBeliefs) ? parsed.coreBeliefs : [],
      metaGoals: Array.isArray(parsed.metaGoals) ? parsed.metaGoals : [],
      philosophyStatement: parsed.philosophyStatement,
      skillChanges: parsed.skillChanges || {},
    };
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// SÍNTESIS PRINCIPAL
// ────────────────────────────────────────────────────────────────

/**
 * Ejecuta síntesis de memoria: convierte episodios recientes en cambios del core
 */
export async function synthesizeMemory(
  cubeId: string,
  personality: Personality,
  cubeName: string
): Promise<SynthesisResult | null> {
  const memory = getCubeMemory(cubeId);

  if (!memory) {
    console.error(`[MemorySynthesis] Memoria no encontrada para ${cubeId}`);
    return null;
  }

  // Verificar que hay episodios suficientes para sintetizar
  if (memory.episodes.length < 3) {
    console.log(
      `[MemorySynthesis] No hay suficientes episodios para ${cubeId}`
    );
    return null;
  }

  console.log(`🧠 [${cubeId}] Iniciando síntesis de memoria...`);

  try {
    // Construir prompt de síntesis
    const prompt = buildSynthesisPrompt(memory, personality, cubeName);

    // Llamar a IA local
    const response = await fetch(LOCAL_AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Eres un sistema de síntesis de memoria. Devuelves SOLO JSON válido, sin texto adicional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[MemorySynthesis] Error HTTP: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Extraer contenido (Ollama format)
    const extractContent = (raw: unknown): string | null => {
      if (!raw) return null;
      if (typeof raw === "string") return raw.trim();

      if (typeof raw !== "object") return null;

      const maybeOllamaFormat = raw as { message?: { content?: unknown } };
      const mc = maybeOllamaFormat.message?.content;
      if (typeof mc === "string" && mc.trim()) return mc.trim();

      const maybeRecord = raw as Record<string, unknown>;
      for (const k of ["response", "reply", "text"]) {
        const v = maybeRecord[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
      return null;
    };

    const trimmed = extractContent(data);
    if (!trimmed) {
      console.error("[MemorySynthesis] Respuesta vacía de IA");
      return null;
    }

    const synthesis = safeParseSynthesis(trimmed);
    if (!synthesis) {
      console.error("[MemorySynthesis] JSON inválido de IA:", trimmed);
      return null;
    }

    console.log(`✅ [${cubeId}] Síntesis exitosa:`, synthesis.summary);

    // Aplicar cambios a memoria
    updateCubeMemory(cubeId, {
      addCoreBeliefs: synthesis.coreBeliefs,
      addMetaGoals: synthesis.metaGoals,
      skillUpdates: synthesis.skillChanges,
    });

    // Actualizar philosophyStatement (sobrescribe)
    if (synthesis.philosophyStatement) {
      const memories = JSON.parse(
        localStorage.getItem("cube.memories") || "{}"
      );
      if (memories[cubeId]) {
        memories[cubeId].philosophyStatement = synthesis.philosophyStatement;
        localStorage.setItem("cube.memories", JSON.stringify(memories));
      }
    }

    // Guardar en synthesisHistory
    const memories = JSON.parse(localStorage.getItem("cube.memories") || "{}");
    if (memories[cubeId]) {
      memories[cubeId].synthesisHistory.push({
        timestamp: Date.now(),
        summary: synthesis.summary,
        skillChanges: synthesis.skillChanges,
      });

      // Limitar historial a últimas 10 síntesis
      if (memories[cubeId].synthesisHistory.length > 10) {
        memories[cubeId].synthesisHistory =
          memories[cubeId].synthesisHistory.slice(-10);
      }

      // Resetear contador de interacciones
      memories[cubeId].conversationStats.interactionsSinceSynthesis = 0;

      localStorage.setItem("cube.memories", JSON.stringify(memories));
    }

    return synthesis;
  } catch (error) {
    console.error(`[MemorySynthesis] Error en síntesis para ${cubeId}:`, error);
    return null;
  }
}

/**
 * Verifica si es momento de ejecutar síntesis
 */
export function shouldSynthesize(cubeId: string): boolean {
  const memory = getCubeMemory(cubeId);
  if (!memory) return false;

  return (
    memory.conversationStats.interactionsSinceSynthesis >= SYNTHESIS_THRESHOLD
  );
}

/**
 * Ejecuta síntesis si es necesario (wrapper conveniente)
 */
export async function maybeSynthesize(
  cubeId: string,
  personality: Personality,
  cubeName: string
): Promise<void> {
  if (shouldSynthesize(cubeId)) {
    await synthesizeMemory(cubeId, personality, cubeName);
  }
}
