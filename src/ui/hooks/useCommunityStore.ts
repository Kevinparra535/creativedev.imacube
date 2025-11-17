import { useSyncExternalStore } from "react";
import { subscribe, listAll } from "../scene/systems/Community";

export function useCommunityCubes() {
  return useSyncExternalStore(
    subscribe,
    listAll,
    listAll // server snapshot same as client (SSR not relevant here)
  );
}
