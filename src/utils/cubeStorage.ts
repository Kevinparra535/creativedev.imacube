import type { CubeData } from "../ui/components/CubeList";
import type { PublicCubeState } from "../ui/scene/systems/Community";

const STORAGE_KEY = "creativedev.cubes";
const DYNAMIC_STATE_KEY = "creativedev.cubes.dynamicState";

/**
 * Load cubes from localStorage or return default configuration
 * Also merges with dynamic states (position, learning, knowledge)
 */
export function loadCubesFromStorage(): CubeData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Load and merge dynamic states
        const dynamicStates = loadDynamicStates();
        return mergeCubeStates(parsed, dynamicStates);
      }
    }
  } catch (error) {
    console.error("Error loading cubes from localStorage:", error);
  }

  // Return empty array on first load - editor will handle first cube creation
  return [];
}

/**
 * Save cubes to localStorage
 */
export function saveCubesToStorage(cubes: CubeData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cubes));
  } catch (error) {
    console.error("Error saving cubes to localStorage:", error);
  }
}

/**
 * Add a new cube to storage
 */
export function addCubeToStorage(newCube: Omit<CubeData, "id" | "position" | "auto" | "isUserCube">): CubeData {
  const existingCubes = loadCubesFromStorage();
  
  // Generate unique ID
  const id = `c${existingCubes.length + 1}`;
  
  // Calculate spawn position (spiral pattern to avoid clustering)
  const index = existingCubes.length;
  const angle = (index * Math.PI * 2) / 5; // Distribute in circle
  const radius = 25;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = 5 + (index % 3) * 2; // Vary height slightly
  
  const cubeData: CubeData = {
    ...newCube,
    id,
    position: [x, y, z],
    auto: true,
    isUserCube: true, // Mark as user's interactive cube
  };
  
  const updatedCubes = [...existingCubes, cubeData];
  saveCubesToStorage(updatedCubes);
  
  return cubeData;
}

/**
 * Check if this is the first time the app is being used
 */
export function isFirstTimeUser(): boolean {
  const cubes = loadCubesFromStorage();
  return cubes.length === 0;
}

/**
 * Clear all cubes from storage (for debugging/reset)
 */
export function clearCubesStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DYNAMIC_STATE_KEY);
}

/**
 * Save dynamic cube states to localStorage (position, learning, knowledge, etc.)
 */
export function saveDynamicStates(states: PublicCubeState[]): void {
  try {
    const stateMap: Record<string, PublicCubeState> = {};
    states.forEach(state => {
      stateMap[state.id] = state;
    });
    localStorage.setItem(DYNAMIC_STATE_KEY, JSON.stringify(stateMap));
    console.log("💾 Saved dynamic states for", states.length, "cubes");
  } catch (error) {
    console.error("Error saving dynamic states:", error);
  }
}

/**
 * Load dynamic cube states from localStorage
 */
export function loadDynamicStates(): Record<string, PublicCubeState> {
  try {
    const stored = localStorage.getItem(DYNAMIC_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("📂 Loaded dynamic states for", Object.keys(parsed).length, "cubes");
      return parsed;
    }
  } catch (error) {
    console.error("Error loading dynamic states:", error);
  }
  return {};
}

/**
 * Merge dynamic states with static cube configuration
 */
export function mergeCubeStates(cubes: CubeData[], dynamicStates: Record<string, PublicCubeState>): CubeData[] {
  return cubes.map(cube => {
    const dynamic = dynamicStates[cube.id];
    if (dynamic) {
      return {
        ...cube,
        position: dynamic.position,
        personality: dynamic.personality,
        socialTrait: dynamic.socialTrait,
        capabilities: dynamic.capabilities,
        learningProgress: dynamic.learningProgress,
        knowledge: dynamic.knowledge,
        readingExperiences: dynamic.readingExperiences,
      };
    }
    return cube;
  });
}

/**
 * Create autonomous NPC cubes to populate the environment
 */
export function createNPCCubes(): CubeData[] {
  const npcCubes: CubeData[] = [
    {
      id: "npc1",
      name: "Cube Zen",
      personality: "calm",
      eyeStyle: "bubble",
      color: "#808080",
      position: [-30, 8, -30],
      auto: true,
      isUserCube: false,
    },
    {
      id: "npc2",
      name: "Cube Social",
      personality: "extrovert",
      eyeStyle: "dot",
      color: "#ff9800",
      position: [30, 7, -30],
      auto: true,
      isUserCube: false,
    },
    {
      id: "npc3",
      name: "Cube Curioso",
      personality: "curious",
      eyeStyle: "bubble",
      color: "#00bcd4",
      position: [-30, 6, 30],
      auto: true,
      isUserCube: false,
    },
    {
      id: "npc4",
      name: "Cube Caos",
      personality: "chaotic",
      eyeStyle: "dot",
      color: "#f44336",
      position: [30, 9, 30],
      auto: true,
      isUserCube: false,
    },
  ];
  
  return npcCubes;
}

/**
 * Initialize environment with NPC cubes if this is first time
 */
export function initializeEnvironment(): void {
  const cubes = loadCubesFromStorage();
  
  // If no cubes exist, this will be handled by the editor
  // NPC cubes will be added after user creates their first cube
  if (cubes.length === 0) {
    return;
  }
  
  // Check if NPC cubes already exist
  const hasNPCs = cubes.some(cube => !cube.isUserCube);
  if (!hasNPCs) {
    // Add NPC cubes to the environment
    const npcCubes = createNPCCubes();
    const allCubes = [...cubes, ...npcCubes];
    saveCubesToStorage(allCubes);
  }
}
