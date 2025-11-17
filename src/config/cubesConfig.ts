import type { CubeData } from "../ui/components/CubeList";

export const CUBES_CONFIG: CubeData[] = [
  { id: "c1", name: "Cube Zen", position: [0, 8, 0], auto: true, personality: "calm", eyeStyle: "bubble" },
  { id: "c2", name: "Cube Social", position: [1, 7, 1], auto: true, personality: "extrovert", eyeStyle: "dot" },
  { id: "c3", name: "Cube Curioso", position: [-1, 6, -1], auto: true, personality: "curious", eyeStyle: "bubble" },
  { id: "c4", name: "Cube Caos", position: [2, 9, -2], auto: true, personality: "chaotic", eyeStyle: "dot" },
  { id: "c5", name: "Cube Neutro", position: [-2, 5, 2], auto: true, personality: "neutral", eyeStyle: "bubble" },
];
