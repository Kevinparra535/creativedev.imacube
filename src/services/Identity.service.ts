import type { Personality } from "../ui/components/CubeList";

// Minimal identity hint tracking persisted in localStorage
// Stores per-cube counters for received personality hints

type HintCounters = Record<string, number>;
interface CubeIdentityHints {
  counters: HintCounters;
  lastUpdated: number;
}
interface IdentityHintsStore {
  [cubeId: string]: CubeIdentityHints;
}

const STORE_KEY = "identity.hints";

function loadStore(): IdentityHintsStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as IdentityHintsStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: IdentityHintsStore) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // ignore persistence errors
  }
}

export function updateIdentityWithHints(
  cubeId: string,
  _personality: Personality,
  hints: string[]
): void {
  if (!cubeId || !hints?.length) return;
  const store = loadStore();
  const entry: CubeIdentityHints = store[cubeId] || { counters: {}, lastUpdated: Date.now() };
  for (const h of hints) {
    entry.counters[h] = (entry.counters[h] || 0) + 1;
  }
  entry.lastUpdated = Date.now();
  store[cubeId] = entry;
  saveStore(store);
}
