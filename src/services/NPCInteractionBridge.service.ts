/**
 * NPCInteractionBridge.service.ts
 *
 * Puente entre la respuesta textual de la IA y acciones expresivas / físicas
 * del cubo dentro del entorno 3D.
 *
 * Objetivo: Traducir keywords simples en la respuesta a un conjunto de
 * "acciones sugeridas" que el sistema físico/visual puede consumir.
 *
 * Este enfoque mantiene la lógica de parsing separada del motor de render.
 */

import { updateCube, getCube } from "../systems/Community";
import type { CubeMemory } from "./CubeMemory.service";

export interface NPCActions {
  emotion?:
    | "feliz"
    | "triste"
    | "curioso"
    | "pensativo"
    | "frustrado"
    | "neutral";
  jump?: boolean;
  colorShift?: string; // Hex override temporal
  modifier?: string; // Nombre de overlay contextual (sarcastico, reflexivo...)
  emphasisLight?: boolean; // Pulso de luz
}

/**
 * Deriva acciones básicas desde la respuesta del NPC.
 * - Regla simple basada en substring (future: embeddings / clasificación)
 */
export function deriveNPCActions(
  response: string,
  memory?: CubeMemory
): NPCActions {
  const text = response.toLowerCase();
  const actions: NPCActions = {};

  // Emociones
  if (/feliz|alegr|content/.test(text)) actions.emotion = "feliz";
  else if (/trist|melancol/.test(text)) actions.emotion = "triste";
  else if (/curios|interes/.test(text)) actions.emotion = "curioso";
  else if (/pensand|reflex|medit/.test(text)) actions.emotion = "pensativo";
  else if (/frustrad|enoja|irrit/.test(text)) actions.emotion = "frustrado";

  // Jump trigger
  if (/salta|jump|brinc/.test(text)) actions.jump = true;

  // Light emphasis
  if (/brill|lum|respland/.test(text)) actions.emphasisLight = true;

  // Modifier overlays (traits emergentes)
  if (/sarcas|irón/.test(text)) actions.modifier = "sarcastico";
  if (/calmado|sereno|tranquil/.test(text)) actions.modifier = "sereno";
  if (/observando|mirando/.test(text)) actions.modifier = "observando";

  // Color shifts (básico; se puede mapear según emoción)
  switch (actions.emotion) {
    case "feliz":
      actions.colorShift = "#ffe066";
      break;
    case "triste":
      actions.colorShift = "#4d81ff";
      break;
    case "curioso":
      actions.colorShift = "#4de4ff";
      break;
    case "frustrado":
      actions.colorShift = "#ff4d4d";
      break;
    case "pensativo":
      actions.colorShift = "#6fa8dc";
      break;
  }

  // Si memoria contiene preferencia notable puede ajustar emoción base
  if (!actions.emotion && memory?.preferences?.length) {
    // Ej: si tiene muchas preferencias aprendidas → curiosidad baseline
    if (memory.preferences.length > 3) actions.emotion = "curioso";
  }

  return actions;
}

/**
 * Aplica acciones al estado público del cubo via Community.updateCube.
 * - Inserta activeModifier con TTL
 * - No muta arrays previos directamente; preserva patrón inmutable.
 */
export function applyNPCActions(cubeId: string, actions: NPCActions) {
  const existing = getCube(cubeId);
  if (!existing) return;
  const mods = existing.activeModifiers || [];
  const now = Date.now();
  const ttl = 4000; // 4s
  const newMods = [...mods];
  if (actions.modifier) {
    newMods.push({ name: actions.modifier, expiresAt: now + ttl });
  }
  if (actions.emotion && !actions.modifier) {
    // Emotion como modifier si no hay específico
    newMods.push({ name: actions.emotion, expiresAt: now + ttl });
  }
  updateCube(cubeId, { activeModifiers: newMods });
  // Guardar acción transitoria para consumo en Cube.tsx (color / jump / light)
  if (actions.colorShift || actions.jump || actions.emphasisLight) {
    updateCube(cubeId, {
      transientAction: {
        colorShift: actions.colorShift,
        jump: actions.jump,
        emphasisLight: actions.emphasisLight,
        expiresAt: now + ttl,
      },
    });
  }
  // Jump/color/light se aplican en capa Cube.tsx vía lectura de modifiers y triggers externos
}
