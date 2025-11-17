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
} from "../styles/CubeList.styles";

export interface CubeData {
  id: string;
  personality?: string;
  eyeStyle?: string;
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
    <Aside>
      <Header>
        <h2>Cubos</h2>
        <Count>{cubes.length}</Count>
      </Header>

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
                <Mode $auto={cube.auto}>
                  {cube.auto ? "Auto" : "Manual"}
                </Mode>
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
                    ({cube.position[0].toFixed(1)}, {cube.position[1].toFixed(1)},{" "}
                    {cube.position[2].toFixed(1)})
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
