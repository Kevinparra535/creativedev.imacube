import { useEffect } from "react";
import { saveDynamicStates } from "../../utils/cubeStorage";
import { listAll } from "../../systems/Community";

/**
 * Hook to automatically persist cube states to localStorage
 * Saves every 5 seconds and on page unload
 */
export function useCubePersistence() {
  useEffect(() => {
    // Function to save current cube states
    const saveCubeStates = () => {
      const allCubes = listAll();
      if (allCubes.length > 0) {
        saveDynamicStates(allCubes);
      }
    };

    // Save periodically (every 5 seconds)
    const interval = setInterval(() => {
      saveCubeStates();
    }, 5000);

    // Save on page unload/refresh
    const handleBeforeUnload = () => {
      saveCubeStates();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Save one last time on unmount
      saveCubeStates();
    };
  }, []);

  // Manual save function (can be called externally if needed)
  const saveNow = () => {
    const allCubes = listAll();
    saveDynamicStates(allCubes);
  };

  return { saveNow };
}
