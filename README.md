# creativedev.imacube

Interactive R3F sandbox with bouncy physics, thought bubbles, swappable cute eyes, personality-driven visuals, and self-righting cubes.

## Stack

- React 19 + TypeScript 5 + Vite (with `rolldown-vite` override)
- React Three Fiber + Drei + Postprocessing
- Cannon physics via `@react-three/cannon`
- Flat ESLint, strict TS, ESM-only

## Quick Start

```pwsh
npm install
npm run dev      # Start dev server with HMR
npm run build    # TypeScript build check + production build
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on entire codebase
```

## Features

- Sandbox box: 6 `Plane` colliders forming a closed room; cubes inside.
- Bouncy physics: tuned restitution/friction for a “gel-like” feel.
- Selection & hop test: click to select, press `Space` to hop.
- Auto-hop: cubes occasionally hop on their own in auto mode.
- Squash & stretch: pre-jump, in-air, and landing scale phases.
- Thought bubbles: Html overlays with cartoon styling and per-cube badge.
- Swappable eyes: `BubbleEyes` (whites+iris+spark) or `DotEyes` (minimal) via prop.
- Personality visuals: color/material/breath/jitter derived from personality + mood.
- Self-righting: detects tilt and re-orients upright (preserving yaw) with a gentle correction hop.

## Key Files

- `src/ui/scene/R3FCanvas.tsx` — Scene setup, physics world, selection/outline.
- `src/ui/scene/components/Cube.tsx` — Physics cube, hop phases, self-righting, eyes, bubble, personality visuals.
- `src/ui/scene/components/Plane.tsx` — Static planes for floor/walls/ceiling.
- `src/ui/scene/ThoughtBubble.css` — Cartoon bubble styles.
- `src/ui/scene/objects/{BubbleEyes,DotEyes}.tsx` — Eye styles with blink and gaze.
- `src/ui/scene/visual/visualState.ts` — Map `personality + mood(thought)` to material/anim targets.

## Visual System

- Personality: `calm | extrovert | curious | chaotic | neutral` sets baseline palette + material.
- Mood: inferred from `thought` text (e.g., “¡Weee!”, “Plof”, “hmm/¿?”) overlays color and micro-animations.
- Targets: `computeVisualTargets` returns `{ color, emissiveIntensity, roughness, metalness, breathAmp, jitterAmp }`.
- Eyes: choose with `eyeStyle="bubble" | "dot"`.

### Example

```tsx
// R3FCanvas.tsx
<Cube id="A" position={[0, 0.5, 0]} personality="curious" eyeStyle="bubble" />
<Cube id="B" position={[1, 0.5, 0]} personality="extrovert" eyeStyle="dot" />
```

## Controls

- Hover to highlight; click a cube to select.
- Press `Space` to hop when a cube is selected.
- Click empty space to clear selection.

## Notes

- `Outline.visibleEdgeColor` must be a number (e.g., `0xffffff`).
- Keep R3F side-effects in `useFrame`; subscribe to Cannon APIs in `useEffect` and clean up.
- Public assets load with `/` prefix; ESM-only (`"type": "module"`).

## License

This project is for learning/demonstration. No license specified.
