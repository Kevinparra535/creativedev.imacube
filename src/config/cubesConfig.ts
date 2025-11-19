import type { CubeData } from "../ui/components/CubeList";

export const CUBES_CONFIG: CubeData[] = [
  {
    id: "c1",
    name: "Cube Zen",
    position: [-30, 8, -30],
    auto: true,
    personality: "calm",
    eyeStyle: "bubble",
  },
  {
    id: "c2",
    name: "Cube Social",
    position: [30, 7, -30],
    auto: true,
    personality: "extrovert",
    eyeStyle: "dot",
  },
  {
    id: "c3",
    name: "Cube Curioso",
    position: [-30, 6, 30],
    auto: true,
    personality: "curious",
    eyeStyle: "bubble",
  },
  {
    id: "c4",
    name: "Cube Caos",
    position: [30, 9, 30],
    auto: true,
    personality: "chaotic",
    eyeStyle: "dot",
  },
  {
    id: "c5",
    name: "Cube Neutro",
    position: [0, 5, 0],
    auto: true,
    personality: "neutral",
    eyeStyle: "bubble",
  },
];
