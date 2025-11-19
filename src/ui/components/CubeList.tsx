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
  // Only show the user's cube in the tabs
  const userCubes = cubes.filter((cube) => cube.isUserCube);
  
  return (
    <TabsContainer>
      {userCubes.map((cube) => (
        <CubeTab
          key={cube.id}
          $selected={selectedId === cube.id}
          onClick={() => onSelect(cube.id)}
        >
          <TabId>{cube.name || cube.id}</TabId>
          {/* <TabPersonality>{cube.personality || "neutral"}</TabPersonality> */}
        </CubeTab>
      ))}
    </TabsContainer>
  );
}
