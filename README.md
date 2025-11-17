# creativedev.imacube

Interactive R3F sandbox with bouncy physics, thought bubbles, cartoon eyes, and self-righting cubes.

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
- Cartoon eyes: pupils/eye scale react to mood inferred from thoughts.
- Self-righting: detects tilt and re-orients upright (preserving yaw) with a gentle correction hop.

## Key Files

- `src/ui/scene/R3FCanvas.tsx` — Scene setup, physics world, selection/outline.
- `src/ui/scene/components/Cube.tsx` — Physics cube, hop phases, self-righting, eyes, bubble.
- `src/ui/scene/components/Plane.tsx` — Static planes for floor/walls/ceiling.
- `src/ui/scene/ThoughtBubble.css` — Cartoon bubble styles.

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
