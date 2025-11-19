import type { CubeData } from "../ui/components/CubeList";

const STORAGE_KEY = "creativedev.cubes";

/**
 * Load cubes from localStorage or return default configuration
 */
export function loadCubesFromStorage(): CubeData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
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
