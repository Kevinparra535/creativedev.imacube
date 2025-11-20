// IdentityState.ts
// Lightweight identity evolution layer: tracks hint counters and trait vector.
// Non-invasive initial version; does not alter existing personality yet.

import type { Personality } from "../../components/CubeList";

export interface TraitsVector {
  curiosity: number;
  empathy: number;
  sarcasm: number;
  seriousness: number;
  playfulness: number;
  introspection: number;
}

export interface IdentityState {
  cubeId: string;
  version: number; // schema version
  personalityBaseline: Personality; // current stable personality
  traitsVector: TraitsVector;
  hintCounters: Record<string, number>; // counts of personalityHints received
  consolidatedTraits: string[]; // promoted traits from repeated hints
  lastUpdated: number; // epoch ms
}

const STORAGE_KEY_PREFIX = "creativedev.identity.";
const SCHEMA_VERSION = 1;

const DEFAULT_VECTOR: TraitsVector = {
  curiosity: 0.5,
  empathy: 0.5,
  sarcasm: 0.1,
  seriousness: 0.3,
  playfulness: 0.5,
  introspection: 0.4,
};

export function loadIdentityState(cubeId: string, baseline: Personality): IdentityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + cubeId);
    if (raw) {
      const parsed: IdentityState = JSON.parse(raw);
      if (parsed.version === SCHEMA_VERSION) return parsed;
    }
  } catch (err) {
    console.warn("Failed to load identity state", err);
  }
  return {
    cubeId,
    version: SCHEMA_VERSION,
    personalityBaseline: baseline,
    traitsVector: { ...DEFAULT_VECTOR },
    hintCounters: {},
    consolidatedTraits: [],
    lastUpdated: Date.now(),
  };
}

function saveIdentityState(state: IdentityState) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + state.cubeId, JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to save identity state", err);
  }
}

// Threshold for consolidating a hint into a trait
const CONSOLIDATION_THRESHOLD = 5;

export function updateIdentityWithHints(cubeId: string, baseline: Personality, hints: string[]): IdentityState {
  const state = loadIdentityState(cubeId, baseline);
  const now = Date.now();
  for (const h of hints) {
    state.hintCounters[h] = (state.hintCounters[h] || 0) + 1;
    // Adjust trait vector heuristically
    switch (h) {
      case "curious":
        state.traitsVector.curiosity = clamp01(state.traitsVector.curiosity + 0.03);
        break;
      case "friendly":
        state.traitsVector.empathy = clamp01(state.traitsVector.empathy + 0.02);
        break;
      case "sarcastic":
        state.traitsVector.sarcasm = clamp01(state.traitsVector.sarcasm + 0.04);
        break;
      case "serious":
        state.traitsVector.seriousness = clamp01(state.traitsVector.seriousness + 0.03);
        break;
      case "funny":
        state.traitsVector.playfulness = clamp01(state.traitsVector.playfulness + 0.03);
        break;
      case "philosophical":
        state.traitsVector.introspection = clamp01(state.traitsVector.introspection + 0.04);
        break;
    }
    // Consolidation
    if (state.hintCounters[h] >= CONSOLIDATION_THRESHOLD && !state.consolidatedTraits.includes(h)) {
      state.consolidatedTraits.push(h);
    }
  }
  state.lastUpdated = now;
  saveIdentityState(state);
  return state;
}

// Placeholder: compute influence factor for future personality blending
export function computePersonalityInfluence(state: IdentityState): { dominantTrait?: string } {
  const entries = Object.entries(state.traitsVector);
  const max = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  if (max[1] > 0.75) return { dominantTrait: max[0] };
  return {};
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Utility for external inspection (debug panel optional)
export function getRawIdentity(cubeId: string, baseline: Personality): IdentityState {
  return loadIdentityState(cubeId, baseline);
}
