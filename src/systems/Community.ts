import type { Personality } from "../ui/components/CubeList";
import type { BehaviorDecision } from "./CognitionTypes";

export type Capability = "selfRighting" | "navigation";

export interface CapabilitiesState {
  selfRighting: boolean;
  navigation: boolean;
}

export interface ActiveModifier {
  name: string;
  expiresAt: number; // epoch ms
}

export interface PublicCubeState {
  id: string;
  position: [number, number, number];
  personality: Personality;
  socialTrait: "kind" | "selfish";
  capabilities: CapabilitiesState;
  /** Active transient behavioral/expressive modifiers with TTL */
  activeModifiers?: ActiveModifier[];
  /** Acciones transitorias de una sola aplicación (colorShift / jump / light) */
  transientAction?: {
    colorShift?: string;
    jump?: boolean;
    emphasisLight?: boolean;
    expiresAt: number;
  };
  /** Última decisión cognitiva del planificador (con TTL aplicado) */
  behaviorState?: BehaviorDecision;
  learningProgress?: { navigation: number; selfRighting: number };
  knowledge?: Record<string, number>;
  readingExperiences?: {
    originalPersonality: string;
    emotionsExperienced: string[];
    traitsAcquired: string[];
    booksRead: string[];
    currentBook?: string;
    readingProgress?: number;
    conceptsLearned?: string[];
  };
}
const registry = new Map<string, PublicCubeState>();
const listeners = new Set<() => void>();
let scheduled = false;
let cachedSnapshot: PublicCubeState[] = [];
let snapshotDirty = true;

function notify() {
  if (scheduled) return;
  scheduled = true;
  snapshotDirty = true; // Mark snapshot as needing refresh
  const schedule =
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame
      : (cb: FrameRequestCallback) =>
          setTimeout(() => cb(performance.now()), 16) as unknown as number;

  schedule(() => {
    scheduled = false;
    listeners.forEach((l) => {
      try {
        l();
      } catch {
        // ignore listener errors
      }
    });
  });
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listAll(): PublicCubeState[] {
  if (snapshotDirty) {
    cachedSnapshot = Array.from(registry.values());
    snapshotDirty = false;
  }
  return cachedSnapshot;
}

export function registerCube(state: PublicCubeState) {
  registry.set(state.id, state);
  notify();
}

export function unregisterCube(id: string) {
  registry.delete(id);
  notify();
}

export function updateCube(id: string, partial: Partial<PublicCubeState>) {
  const cur = registry.get(id);
  if (!cur) return;
  const now = Date.now();
  const filteredPrevMods = (cur.activeModifiers || []).filter(m => m.expiresAt > now);
  let incomingMods = partial.activeModifiers;
  if (incomingMods) {
    incomingMods = incomingMods.filter(m => m.expiresAt > now);
  }
  const next: PublicCubeState = { ...cur, ...partial, activeModifiers: incomingMods || filteredPrevMods } as PublicCubeState;
  const posChanged =
    cur.position[0] !== next.position[0] ||
    cur.position[1] !== next.position[1] ||
    cur.position[2] !== next.position[2];
  const persChanged = cur.personality !== next.personality;
  const traitChanged = cur.socialTrait !== next.socialTrait;
  const caps = cur.capabilities;
  const capn = next.capabilities;
  const capsChanged =
    caps !== capn &&
    !!capn &&
    (caps.navigation !== capn.navigation ||
      caps.selfRighting !== capn.selfRighting);

  // Check learningProgress changes
  const lpChanged =
    cur.learningProgress !== next.learningProgress &&
    !!next.learningProgress &&
    (cur.learningProgress?.navigation !== next.learningProgress.navigation ||
      cur.learningProgress?.selfRighting !==
        next.learningProgress.selfRighting);

  // Check knowledge changes (any domain value changed)
  const knowledgeChanged =
    cur.knowledge !== next.knowledge &&
    !!next.knowledge &&
    (!cur.knowledge ||
      Object.keys(next.knowledge).some(
        (key) => cur.knowledge![key] !== next.knowledge![key]
      ));

  // Check reading experiences changes (shallow compare of fields we expose)
  const reCur = cur.readingExperiences;
  const reNext = next.readingExperiences;
  const readingExpChanged =
    reCur !== reNext &&
    !!reNext &&
    (reCur?.currentBook !== reNext.currentBook ||
      reCur?.readingProgress !== reNext.readingProgress ||
      (reCur?.emotionsExperienced?.length || 0) !==
        (reNext.emotionsExperienced?.length || 0) ||
      (reCur?.traitsAcquired?.length || 0) !==
        (reNext.traitsAcquired?.length || 0) ||
      (reCur?.booksRead?.length || 0) !== (reNext.booksRead?.length || 0) ||
      (reCur?.conceptsLearned?.length || 0) !==
        (reNext.conceptsLearned?.length || 0));

  // Active modifiers change detection (length or any difference in set)
  const modsCur = cur.activeModifiers || [];
  const modsNext = next.activeModifiers || [];
  const modsChanged =
    modsCur.length !== modsNext.length ||
    (modsCur.length === modsNext.length &&
      modsCur.some(
        (m, i) =>
          m.name !== modsNext[i].name || m.expiresAt !== modsNext[i].expiresAt
      ));

  // Transient action change
  const transientChanged = cur.transientAction !== next.transientAction;

  // Behavior state change (shallow compare key fields)
  const bsCur = (cur as any).behaviorState;
  const bsNext = (next as any).behaviorState;
  const behaviorChanged = bsCur !== bsNext && !!bsNext && (
    bsCur?.goal !== bsNext.goal ||
    bsCur?.intent !== bsNext.intent ||
    bsCur?.mood !== bsNext.mood
  );

  if (
    posChanged ||
    persChanged ||
    traitChanged ||
    capsChanged ||
    lpChanged ||
    knowledgeChanged ||
    readingExpChanged ||
    modsChanged ||
    transientChanged ||
    behaviorChanged
  ) {
    registry.set(id, next);
    notify();
  }
}

export function getCube(id: string): PublicCubeState | undefined {
  return registry.get(id);
}

// Periodic cleanup of expired modifiers (can be invoked independently e.g. from RAF throttle)
export function pruneExpiredModifiers() {
  const now = Date.now();
  let touched = false;
  for (const [id, state] of registry.entries()) {
    const mods = state.activeModifiers || [];
    const freshMods = mods.filter(m => m.expiresAt > now);
    if (freshMods.length !== mods.length) {
      registry.set(id, { ...state, activeModifiers: freshMods });
      touched = true;
    }
  }
  if (touched) notify();
}

export function getNeighbors(
  id: string,
  position: [number, number, number],
  radius = 6
): PublicCubeState[] {
  const res: PublicCubeState[] = [];
  registry.forEach((st, key) => {
    if (key === id) return;
    const dx = st.position[0] - position[0];
    const dy = st.position[1] - position[1];
    const dz = st.position[2] - position[2];
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 <= radius * radius) res.push(st);
  });
  return res;
}
