import type { CubeData } from "../ui/components/CubeList";

export const CUBES_CONFIG: CubeData[] = [
  {
    id: "c1",
    name: "Cube Zen",
    position: [-10, 8, -10],
    auto: true,
    personality: "calm",
    eyeStyle: "bubble",
  },
  {
    id: "c2",
    name: "Cube Social",
    position: [10, 7, -10],
    auto: true,
    personality: "extrovert",
    eyeStyle: "dot",
  },
  {
    id: "c3",
    name: "Cube Curioso",
    position: [-15, 6, 10],
    auto: true,
    personality: "curious",
    eyeStyle: "bubble",
  },
  {
    id: "c4",
    name: "Cube Caos",
    position: [5, 9, 15],
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
