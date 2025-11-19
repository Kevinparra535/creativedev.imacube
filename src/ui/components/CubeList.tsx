import { TabsContainer, CubeTab, TabId } from "../styles/CubeList.styles";

export type Personality =
  | "calm"
  | "extrovert"
  | "curious"
  | "chaotic"
  | "neutral";
export type EyeStyle = "bubble" | "dot";

export interface CubeData {
  id: string;
  name?: string;
  personality?: Personality;
  eyeStyle?: EyeStyle;
  color?: string; // Hex color for the cube
  auto?: boolean;
  isUserCube?: boolean; // True if this is the user's interactive cube
  position?: [number, number, number];
  
  // Dynamic runtime state (persisted)
  capabilities?: {
    navigation: boolean;
    selfRighting: boolean;
  };
  learningProgress?: {
    navigation: number;
    selfRighting: number;
  };
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
  socialTrait?: "kind" | "selfish";
}

interface CubeListProps {
  cubes: CubeData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}
export default function CubeList({
  cubes,
  selectedId,
  onSelect,
}: CubeListProps) {
  return (
    <TabsContainer>
      {cubes.map((cube) => (
        <CubeTab
          key={cube.id}
          $selected={selectedId === cube.id}
          onClick={() => onSelect(cube.id)}
        >
          <TabId>
            {cube.isUserCube && "👤 "}
            {cube.name || cube.id}
          </TabId>
          {/* <TabPersonality>{cube.personality || "neutral"}</TabPersonality> */}
        </CubeTab>
      ))}
    </TabsContainer>
  );
}
