import { useMemo, useState } from "react";
import R3FCanvas from "./scene/R3FCanvas";
import { CUBES_CONFIG } from "../config/cubesConfig";
import { GlobalStyles } from "./styles/base";
import CubeList from "./components/CubeList";
import CubeFooter from "./components/CubeFooter";
import { useCommunityCubes } from "./hooks/useCommunityStore";

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraLocked, setCameraLocked] = useState(true);
  const live = useCommunityCubes();

  // Merge static config with live registry (position/capabilities)
  const cubesLive = useMemo(() => {
    return CUBES_CONFIG.map((c) => {
      const found = live.find((l) => l.id === c.id);
      return {
        ...c,
        position: found?.position ?? c.position,
        personality: found?.personality ?? c.personality,
        // Attach capabilities for footer if available
        capabilities: found?.capabilities,
      };
    });
  }, [live]);

  return (
    <>
      <GlobalStyles />
      <R3FCanvas selectedId={selectedId} onSelect={setSelectedId} cameraLocked={cameraLocked} onCameraLockChange={setCameraLocked} />
      <CubeList cubes={cubesLive} selectedId={selectedId} onSelect={setSelectedId} cameraLocked={cameraLocked} />
      <CubeFooter cubes={cubesLive} selectedId={selectedId} />
    </>
  );
}

export default App;
