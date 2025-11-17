import { useState } from "react";
import R3FCanvas from "./scene/R3FCanvas";
import { CUBES_CONFIG } from "./scene/cubesConfig";
import { GlobalStyles } from "./styles/base";
import CubeList from "./components/CubeList";

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <GlobalStyles />
      <R3FCanvas selectedId={selectedId} onSelect={setSelectedId} />
      <CubeList
        cubes={CUBES_CONFIG}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </>
  );
}

export default App;
