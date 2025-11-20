export type BehaviorTargetType = "book" | "cube" | "zone" | "none";

export interface BehaviorTarget {
  type: BehaviorTargetType;
  id?: string;
  position?: [number, number, number];
}

export interface LearningUpdate {
  addTraits?: string[];
  addFacts?: string[];
  addPreferences?: string[];
}

export type PersonalityShift =
  | "more_calm"
  | "more_curious"
  | "more_extrovert"
  | "more_chaotic"
  | "more_neutral"
  | "none";

export interface TransientEffects {
  jump?: boolean;
  colorShift?: string; // hex or named color
  lightPulse?: boolean;
}

export interface BehaviorDecision {
  /** High-level goal the NPC is pursuing */
  goal: string; // e.g., "explore", "read", "socialize", "reflect"
  /** Short intent summary for this tick */
  intent: string; // e.g., "move_to_book", "greet_cube", "idle_observe"
  /** Optional target to bias navigation */
  target?: BehaviorTarget;
  /** One-shot expressive/physical effects to apply */
  transient?: TransientEffects;
  /** Learning to incorporate into memory */
  learning?: LearningUpdate;
  /** Mood hint for visual layer */
  mood?: string;
  /** Suggested small shift to personality over time */
  personalityShift?: PersonalityShift;
  /** How long this decision remains valid in ms */
  ttlMs?: number;
}
