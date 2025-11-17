export type Personality = "calm" | "extrovert" | "curious" | "chaotic" | "neutral";

export interface VisualTargets {
  color: string; // hex
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  breathAmp: number; // 0..0.1 extra Y scale oscillation
  jitterAmp: number; // 0..small scale jitter for confusion
}

const personalityBase: Record<Personality, VisualTargets> = {
  calm: {
    color: "#9aa0a6",
    emissiveIntensity: 0.04,
    roughness: 0.7,
    metalness: 0.05,
    breathAmp: 0.02,
    jitterAmp: 0.0,
  },
  extrovert: {
    color: "#ffb347",
    emissiveIntensity: 0.12,
    roughness: 0.35,
    metalness: 0.2,
    breathAmp: 0.03,
    jitterAmp: 0.0,
  },
  curious: {
    color: "#44e0c7",
    emissiveIntensity: 0.08,
    roughness: 0.5,
    metalness: 0.1,
    breathAmp: 0.025,
    jitterAmp: 0.01,
  },
  chaotic: {
    color: "#ff5b5b",
    emissiveIntensity: 0.15,
    roughness: 0.25,
    metalness: 0.25,
    breathAmp: 0.02,
    jitterAmp: 0.02,
  },
  neutral: {
    color: "#8e8e8e",
    emissiveIntensity: 0.05,
    roughness: 0.6,
    metalness: 0.1,
    breathAmp: 0.02,
    jitterAmp: 0.0,
  },
};

export function computeVisualTargets(
  thought: string,
  personality: Personality,
  selected: boolean,
  hovered: boolean
): VisualTargets {
  const base = personalityBase[personality] || personalityBase.neutral;
  const res: VisualTargets = { ...base };

  const txt = (thought || "").toLowerCase();
  // Mood overlays by keywords
  if (txt.includes("weee") || txt.includes("!")) {
    res.color = "#ffd166"; // happy warm
    res.emissiveIntensity = Math.max(res.emissiveIntensity, 0.12);
    res.breathAmp += 0.01;
  } else if (txt.includes("plof") || txt.includes("triste")) {
    res.color = "#7bb4ff";
    res.emissiveIntensity = Math.max(res.emissiveIntensity, 0.06);
    res.roughness = Math.min(0.8, res.roughness + 0.1);
  } else if (txt.includes("hmm") || txt.includes("¿") || txt.includes("?")) {
    res.color = "#5df0a5"; // curious greenish
    res.jitterAmp = Math.max(res.jitterAmp, 0.015);
  }

  // UI overlays
  if (hovered) {
    res.color = "#ff69b4"; // hotpink
    res.emissiveIntensity = Math.max(res.emissiveIntensity, 0.1);
  }
  if (selected) {
    res.color = "#00d8ff";
    res.emissiveIntensity = Math.max(res.emissiveIntensity, 0.14);
  }

  return res;
}
