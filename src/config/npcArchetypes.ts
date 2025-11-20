/**
 * npcArchetypes.ts
 * Map personality → archetype model name for multi-model Ollama strategy.
 */

export type NpcArchetype = "villager" | "mentor" | "trickster";

// Personality → archetype mapping (can be refined later)
export function getArchetypeForPersonality(personality: string): NpcArchetype {
  switch (personality) {
    case "calm":
    case "neutral":
      return "villager";
    case "curious":
    case "extrovert":
      return "mentor";
    case "chaotic":
      return "trickster";
    default:
      return "villager";
  }
}

// Archetype → local Ollama model name
export function getModelNameForArchetype(archetype: NpcArchetype): string {
  switch (archetype) {
    case "villager":
      return "villager-npc";
    case "mentor":
      return "mentor-npc";
    case "trickster":
      return "trickster-npc";
    default:
      return "villager-npc";
  }
}
