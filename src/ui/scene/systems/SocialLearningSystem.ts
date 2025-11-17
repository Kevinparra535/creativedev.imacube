import type { Personality } from "../../components/CubeList";
import type { Capability, CapabilitiesState, PublicCubeState } from "./Community";

// Teaching willingness baseline by personality and social trait
const TEACH_WILLINGNESS: Record<"kind" | "selfish", Record<Personality, number>> = {
  kind: {
    calm: 0.6,
    extrovert: 0.85,
    curious: 0.9,
    chaotic: 0.3,
    neutral: 0.6,
  },
  selfish: {
    calm: 0.2,
    extrovert: 0.35,
    curious: 0.4,
    chaotic: 0.15,
    neutral: 0.3,
  },
};

export interface LearnOutcome {
  learned: Partial<CapabilitiesState>;
  taughtBy?: string; // teacher id
}

export function willTeach(teacher: PublicCubeState, capability: Capability): boolean {
  const p = teacher.personality;
  const t = teacher.socialTrait;
  const base = TEACH_WILLINGNESS[t][p] || 0;
  // Optionally bias by capability (navigation is more showy)
  const capBias = capability === "navigation" ? 0.05 : 0;
  return Math.random() < Math.min(1, base + capBias);
}

export function tryLearnFromNeighbors(
  _self: PublicCubeState,
  neighbors: PublicCubeState[],
  needs: (keyof CapabilitiesState)[],
): LearnOutcome | null {
  const learned: Partial<CapabilitiesState> = {};
  for (const cap of needs) {
    // Find any neighbor with the capability that is willing to teach
    const teacher = neighbors.find((n) => n.capabilities[cap] && willTeach(n, cap));
    if (teacher) {
      learned[cap] = true;
      return { learned, taughtBy: teacher.id };
    }
  }
  return null;
}

// Spontaneous discovery chance (bootstrapping) — higher for curious
export function spontaneousDiscovery(personality: Personality, capability: Capability): boolean {
  const base = capability === "navigation" ? 0.06 : 0.04; // navigation easier to stumble upon
  const boost = personality === "curious" ? 0.06 : personality === "extrovert" ? 0.03 : 0;
  return Math.random() < base + boost;
}
