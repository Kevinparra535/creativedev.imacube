import type { Personality } from "../../components/CubeList";

export type Capability = "selfRighting" | "navigation";

export interface CapabilitiesState {
  selfRighting: boolean;
  navigation: boolean;
}

export interface PublicCubeState {
  id: string;
  position: [number, number, number];
  personality: Personality;
  socialTrait: "kind" | "selfish";
  capabilities: CapabilitiesState;
}

const registry = new Map<string, PublicCubeState>();

export function registerCube(state: PublicCubeState) {
  registry.set(state.id, state);
}

export function unregisterCube(id: string) {
  registry.delete(id);
}

export function updateCube(id: string, partial: Partial<PublicCubeState>) {
  const cur = registry.get(id);
  if (!cur) return;
  registry.set(id, { ...cur, ...partial });
}

export function getCube(id: string): PublicCubeState | undefined {
  return registry.get(id);
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
