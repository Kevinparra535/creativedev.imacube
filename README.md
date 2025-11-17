# creativedev.imacube

Interactive R3F sandbox with bouncy physics, thought bubbles, swappable cute eyes with eyebrows, personality-driven visuals, self-righting cubes, and a ReactFlow-powered knowledge graph UI.

## Stack

- React 19 + TypeScript 5 + Vite (with `rolldown-vite` override)
- React Three Fiber + Drei + Postprocessing
- Cannon physics via `@react-three/cannon`
- ReactFlow (`@xyflow/react`) for interactive node visualization
- Styled-components v6 for UI styling
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

### 3D Physics Sandbox

- **Sandbox box**: 6 `Plane` colliders forming a closed room; cubes inside.
- **Bouncy physics**: tuned restitution/friction for a "gel-like" feel.
- **Books rain**: randomly spawned physical books (boxes) with high restitution for dynamic collisions.
- **Selection & hop test**: click to select, press `Space` to hop.
- **Auto-hop**: cubes occasionally hop on their own in auto mode.
- **Squash & stretch**: pre-jump, in-air, and landing scale phases.
- **Self-righting**: detects tilt and re-orients upright (preserving yaw) with a gentle correction hop.

### Visual Expression System

- **Thought bubbles**: Html overlays with cartoon styling and per-cube badge.
- **Swappable eyes**: `BubbleEyes` (whites+iris+pupil+spark) or `DotEyes` (minimal) via prop.
- **Animated eyebrows**: 8 mood expressions (happy, sad, angry, curious, prep, air, land, neutral) with smooth transitions.
- **Personality visuals**: color/material/breath/jitter derived from personality + mood.
- **Mood system**: Calculates emotional state from thought content and personality baseline:
  - Physical phases: `prep` (preparing jump), `land` (impact)
  - Emotional states: `happy`, `sad`, `angry`, `curious`
  - Personality-driven defaults: extroverts → happy, chaotic → angry, curious → curious

### UI Components

- **Sidebar (CubeList)**: Right panel showing all cubes with their properties (personality, eye style, position, mode).
- **Footer (CubeFooter)**: Bottom ReactFlow graph visualizing selected cube's:
  - **Emociones** (emotions) - Dynamic based on personality
  - **Personalidad** (personality traits) - Character attributes
  - **Conocimientos** (knowledge/skills) - Abilities and capabilities
  - Interactive nodes with animated edges, zoom/pan controls, and minimap

## Key Files

### 3D Scene

- `src/ui/scene/R3FCanvas.tsx` — Scene setup, physics world, selection/outline, cube orchestration.
- `src/ui/scene/components/Cube.tsx` — Physics cube, hop phases, self-righting, eyes, eyebrows, bubble, personality visuals.
- `src/ui/scene/components/Plane.tsx` — Static planes for floor/walls/ceiling.
- `src/ui/scene/objects/Books.tsx` — Randomly spawned physics books with collision/bounce dynamics.
- `src/ui/scene/objects/{BubbleEyes,DotEyes}.tsx` — Eye styles with blink, gaze tracking, and mood-based eyebrows.
- `src/ui/scene/cubesConfig.ts` — Centralized cube configuration array.
- `src/ui/scene/visual/visualState.ts` — Map `personality + mood(thought)` to material/anim targets.

### UI Components & Styles

- `src/ui/App.tsx` — Main app orchestrator, manages selection state.
- `src/ui/components/CubeList.tsx` — Sidebar roster of cubes.
- `src/ui/components/CubeFooter.tsx` — ReactFlow knowledge graph visualization.
- `src/ui/styles/CubeList.styles.ts` — Styled-components for sidebar.
- `src/ui/styles/CubeFooter.styles.ts` — Styled-components for footer with ReactFlow theme.
- `src/ui/styles/base.ts` — Global styles.
- `src/ui/styles/ThoughtBubble.css` — Cartoon bubble styles (legacy CSS).

## Visual System

### Personality Types

- **calm**: Tranquilo, observador, paciente - Gray palette, subtle breathing
- **extrovert**: Sociable, expresivo, optimista - Orange palette, high emissive
- **curious**: Investigador, analítico, creativo - Cyan palette, slight jitter
- **chaotic**: Impredecible, intenso, apasionado - Red palette, strong jitter
- **neutral**: Equilibrado, adaptable, racional - Gray palette, balanced

### Mood & Eyebrow Expressions

Moods are calculated with 3-tier priority:

1. **Physical phases** (temporary): `prep` (focused/furrowed), `land` (impact/shocked)
2. **Cognitive states** (from thought keywords): `happy`, `sad`, `angry`, `curious`
3. **Personality baseline** (idle default): extrovert→happy, chaotic→angry, curious→curious

Eyebrow mappings:

- **happy** 😊: Raised (Y: 0.26), arched upward (rotation: 0.18)
- **sad** 😢: Inner corners raised (Y: 0.21, rotation: 0.2)
- **angry** 😠: Low and furrowed (Y: 0.19, rotation: -0.3)
- **curious** 🤔: Slightly raised (Y: 0.24, rotation: 0.12)
- **prep** 😤: Concentrated/furrowed (Y: 0.2, rotation: -0.2)
- **air** 😮: Surprised/raised (Y: 0.27, rotation: 0.15)
- **land** 😲: Impact/shocked (Y: 0.18, rotation: -0.1)

### Visual Targets

`computeVisualTargets(thought, personality, selected, hovered)` returns:

- `color`: Hex color for material
- `emissiveIntensity`: Glow strength
- `roughness`: Material roughness (0-1)
- `metalness`: Material metalness (0-1)
- `breathAmp`: Idle breathing animation amplitude
- `jitterAmp`: Confusion/chaos jitter amplitude

### Example

```tsx
// R3FCanvas.tsx
<Cube id="A" position={[0, 0.5, 0]} personality="curious" eyeStyle="bubble" auto={false} />
<Cube id="B" position={[1, 0.5, 0]} personality="extrovert" eyeStyle="dot" auto={true} />
```

## Controls

- **Hover** to highlight a cube
- **Click** a cube to select (sidebar and footer update)
- **Space** to make selected cube hop (manual mode)
- **Click empty space** to clear selection
- **Footer**: Drag nodes, zoom/pan, use controls

## ReactFlow Knowledge Graph

When a cube is selected, the footer displays an interactive graph:

- **Central node**: Cube ID and personality
- **Left side**: Emotions (😊) connected to cube
- **Right side**: Personality traits (🎭) connected from cube
- **Bottom**: Knowledge nodes (🧠) in grid layout
- **Active nodes**: Highlighted with blue border and animated edges
- **Inactive nodes**: Grayed out with no connections

## Notes

- `Outline.visibleEdgeColor` must be a number (e.g., `0xffffff`).
- Keep R3F side-effects in `useFrame`; subscribe to Cannon APIs in `useEffect` and clean up.
- Public assets load with `/` prefix; ESM-only (`"type": "module"`).
- Eyebrows use `boxGeometry` for horizontal orientation (not capsuleGeometry).
- Don't access refs during render (React 19 purity); use state or move logic to effects.
- Use `useState(() => ...)` initializer for random generation to satisfy React 19 purity.

## License

This project is for learning/demonstration. No license specified.
