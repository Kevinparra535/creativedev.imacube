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
  auto?: boolean;
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
  return (
    <TabsContainer>
      {cubes.map((cube) => (
        <CubeTab
          key={cube.id}
          $selected={selectedId === cube.id}
          onClick={() => onSelect(cube.id)}
        >
          <TabId>{cube.id}</TabId>
          {/* <TabPersonality>{cube.personality || "neutral"}</TabPersonality> */}
        </CubeTab>
      ))}
    </TabsContainer>
  );
}
