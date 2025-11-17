import {
  Aside,
  Header,
  Count,
  ItemsContainer,
  CubeButton,
  ItemHeader,
  ItemId,
  Mode,
  Details,
  Detail,
  Label,
  Value,
  CameraHint,
} from "../styles/CubeList.styles";

export type Personality =
  | "calm"
  | "extrovert"
  | "curious"
  | "chaotic"
  | "neutral";
export type EyeStyle = "bubble" | "dot";

export interface CubeData {
  id: string;
  personality?: Personality;
  eyeStyle?: EyeStyle;
  auto?: boolean;
  position?: [number, number, number];
}

interface CubeListProps {
  cubes: CubeData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  cameraLocked?: boolean;
}
export default function CubeList({
  cubes,
  selectedId,
  onSelect,
  cameraLocked,
}: CubeListProps) {
  return (
    <Aside>
      <Header>
        <h2>Cubos</h2>
        <Count>{cubes.length}</Count>
      </Header>

      {selectedId && (
        <CameraHint $locked={cameraLocked ?? true}>
          {cameraLocked ? "🔒 Cámara bloqueada" : "🔓 Cámara libre"}
          <span>Presiona ESPACIO para {cameraLocked ? "desbloquear" : "bloquear"}</span>
        </CameraHint>
      )}

      <ItemsContainer>
        {cubes.map((cube) => (
          <CubeButton
            key={cube.id}
            $selected={selectedId === cube.id}
            onClick={() => onSelect(cube.id)}
          >
            <ItemHeader>
              <ItemId>{cube.id}</ItemId>
              {cube.auto !== undefined && (
                <Mode $auto={cube.auto}>{cube.auto ? "Auto" : "Manual"}</Mode>
              )}
            </ItemHeader>

            <Details>
              {cube.personality && (
                <Detail>
                  <Label>Personalidad:</Label>
                  <Value>{cube.personality}</Value>
                </Detail>
              )}
              {cube.eyeStyle && (
                <Detail>
                  <Label>Ojos:</Label>
                  <Value>{cube.eyeStyle}</Value>
                </Detail>
              )}
              {cube.position && (
                <Detail>
                  <Label>Posición:</Label>
                  <Value>
                    ({cube.position[0].toFixed(1)},{" "}
                    {cube.position[1].toFixed(1)}, {cube.position[2].toFixed(1)}
                    )
                  </Value>
                </Detail>
              )}
            </Details>
          </CubeButton>
        ))}
      </ItemsContainer>
    </Aside>
  );
}
