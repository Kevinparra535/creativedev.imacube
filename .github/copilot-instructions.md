# Copilot Instructions for creativedev.imacube

## Project Overview

React 19.2 + TypeScript + Vite (via `rolldown-vite` override). Modern ESM, strict TS, flat ESLint. Includes a Three.js scene powered by React Three Fiber with physics, postprocessing, thought bubbles, cartoon eyes with eyebrows, self-righting cubes, and a ReactFlow-powered knowledge graph UI.

## Key Architecture Decisions

- **Rolldown Integration**: Uses `rolldown-vite@7.2.2` instead of standard Vite for improved build performance. This is enforced via `package.json` overrides.
- **React 19**: Running the latest React with new features like `react-jsx` transform and enhanced StrictMode.
- **Flat ESLint Config**: Uses the new flat config format (`eslint.config.js`) with `defineConfig` and `globalIgnores` - avoid legacy `.eslintrc` patterns.
- **TypeScript Project References**: Uses composite config with `tsconfig.app.json` (app code) and `tsconfig.node.json` (build tooling).
- **3D Scene & Physics**: `@react-three/fiber` + `@react-three/cannon` for physics, `@react-three/drei` helpers, and `@react-three/postprocessing` for outlines/selection.
- **UI Framework**: Styled-components v6 with transient props (`$propName`) for dynamic styling.
- **Knowledge Graph**: ReactFlow (`@xyflow/react`) for interactive node visualization in footer.

## Development Workflows

### Running the Project
```bash
npm run dev          # Start dev server with HMR
npm run build        # TypeScript check + production build
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on entire codebase
```

### Build Process
The build runs TypeScript compilation first (`tsc -b`) before Vite build - both must pass. TypeScript uses `noEmit: true` since Vite handles transpilation.

## TypeScript Configuration

- **Strict Mode Enabled**: All strict checks active plus additional rules (`noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`)
- **Bundler Module Resolution**: Uses `moduleResolution: "bundler"` with `allowImportingTsExtensions: true`
- **Verbatim Module Syntax**: `verbatimModuleSyntax: true` requires explicit `type` imports - use `import type { ... }` for types
- **Target**: ES2022 features available (top-level await, class fields, etc.)

Project-specific TS patterns used in 3D scene:
- Use `useRef` to store animation/physics state between frames (phases, timers, target scales).
- Subscribe to Cannon `api.position/velocity` inside `useEffect`, not at render time.
- Use numeric hex for postprocessing colors (e.g., `visibleEdgeColor={0xffffff}`).

## Code Conventions

### Import Patterns
```tsx
// Type-only imports must use 'type' keyword
import type { ComponentProps } from 'react'
// Regular imports
import { useState } from 'react'
// Asset imports work with Vite typing
import logo from './assets/logo.svg'
import publicAsset from '/public-asset.svg'  // Public folder assets use /
```

### Component Structure
- **Entry Point**: `src/main.tsx` renders into `#root` div with StrictMode wrapper
- **Styles**: Component-level CSS files (e.g., `App.css`) co-located with components
- **Assets**: Component assets in `src/assets/`, public static files in `public/`

### R3F Scene Structure (3D)
- **Scene file**: `src/ui/scene/R3FCanvas.tsx`
- **Components**: `src/ui/scene/components/Cube.tsx`, `src/ui/scene/components/Plane.tsx`
- **Config**: `src/ui/scene/cubesConfig.ts` (centralized cube configuration array)
- **Objects**: `src/ui/scene/objects/{BubbleEyes,DotEyes}.tsx` (ojos intercambiables por props con cejas animadas), `src/ui/scene/objects/Books.tsx` (libros físicos aleatorios)
- **Visual**: `src/ui/scene/visual/visualState.ts` (mapea personalidad/estado → material y micro-animaciones)
- **UI Components**: `src/ui/components/{CubeList,CubeFooter}.tsx` (sidebar y footer con ReactFlow)
- **Styles**: `src/ui/styles/{CubeList,CubeFooter}.styles.ts` (styled-components), `src/ui/styles/ThoughtBubble.css` (legacy CSS para burbujas)
- **Sandbox geometry**: 6 `Plane` bodies forming a closed cube; `Cube` bodies inside.
- **Physics config**: `Physics` node with `gravity`, `defaultContactMaterial` (tuned `restitution`, `friction`, `contactEquationRelaxation` for springy collisions).
- **Materials**: Dynamic restitution/friction on cubes/planes to achieve bouncy, "gel-like" feel.
- **Books**: Individual physics bodies (`useBox`) spawned randomly within sandbox bounds; uses `useState` initializer to generate random positions/rotations/colors once at mount (React 19 purity compliance).
- **Postprocessing**: `EffectComposer` + `Outline` for hover/selection highlight.

### Interaction & Animation Pattern
- **Selection**: Parent (`App.tsx`) tracks `selectedId` state shared between `R3FCanvas`, `CubeList`, and `CubeFooter`. Click cube selects; click vacío (`onPointerMissed`) deselecciona.
- **Camera follow system**: `FollowCamera` component with smooth lerp (k=2.5*delta), preserves user rotation via controlstart/controlend events, toggleable with Space key.
- **Camera lock toggle**: `cameraLocked` state managed at `App.tsx`, passed to `R3FCanvas` and `CubeList`. Space key context-aware: toggle lock when cube selected, hop when no selection.
- **Manual hop test**: Parent listens to `Space` and increments a `hopSignal` counter; `Cube` detects changes to trigger jump when `selected`.
- **Squash & Stretch**: `Cube` uses `useFrame` to lerp `scale` toward phase targets:
	- Pre-salto: `[1.25, 0.75, 1.25]`
	- En aire: `[0.9, 1.1, 0.9]`
	- Aterrizaje: `[1.3, 0.7, 1.3]` → luego ` [1,1,1]`
- **Impulso físico**: `api.applyImpulse([dx, 3.2, dz], [0,0,0])` con `dx/dz` aleatorios (en modo auto) o sólo al presionar espacio (modo test).
- **Self-righting (auto-enderezado)**: Suscríbete a `api.quaternion`, calcula el `tilt` mediante el up-vector (`acos(up.y)`), genera un objetivo vertical preservando yaw y aplica `Quaternion.slerp` con amortiguación de `angularVelocity` para estabilizar.
- **Ojos intercambiables**: `Cube` acepta `eyeStyle={"bubble"|"dot"}` y renderiza `BubbleEyes` o `DotEyes` sobre la cara +Z.
- **Cejas animadas**: Ambos estilos de ojos incluyen cejas (`boxGeometry` horizontal) con 8 expresiones de mood (happy, sad, angry, curious, prep, air, land, neutral). Las cejas se animan mediante `useFrame` con lerp suave de posición Y y rotación Z.
- **Mood calculation**: `Cube` calcula mood con 3 prioridades:
	1. **Fases físicas** (preparando salto → prep, impacto → land)
	2. **Estados cognitivos** (keywords en thought: "weee/!" → happy, "triste" → sad, "grr/frustrado" → angry, "hmm/¿/?" → curious)
	3. **Personalidad baseline** (extrovert → happy, chaotic → angry, curious → curious cuando idle)
- **Confusion wobble**: Detecta "confusión", "¿", "?", "no entiendo" en thought → aplica sin(time*6)*0.03 a scale X/Z.
- **Face camera**: Cuando selected + !navigating + idle/settle/observing → slerp quaternion hacia yaw de cámara (rate: 4*delta).
- **Point light**: Child component en Cube seleccionado, intensity = 0.6 + 1.6*pulseStrength, pulsa con aprendizaje.
- **Chaotic flicker**: Personality chaotic → emissiveIntensity += sin(time*18)*0.06 para efecto nervioso.
- **Book completion flash**: pulseStrength = max(current, 1) al terminar lectura → dispara luz y emissive.
- **Personalidad/estado visual**: `Cube` acepta `personality` (`calm|extrovert|curious|chaotic|neutral`). `computeVisualTargets(thought, personality, selected, hovered)` devuelve `{ color, emissiveIntensity, roughness, metalness, breathAmp, jitterAmp }` para material y micro-animaciones (respiración/jitter sutil).
- **ReactFlow Knowledge Graph**: `CubeFooter` renderiza un grafo interactivo con nodos de emociones, personalidad, conocimientos (philosophy, theology, science, arts...), y conceptos aprendidos (últimos 6). Usa `@xyflow/react` con nodos posicionados, edges animados, controles de zoom/pan, y minimap.
- **Learning & Knowledge System**:
	- **Community registry**: Map-based pub-sub con RAF throttling, detecta cambios en position, personality, readingExperiences (incluye conceptsLearned).
	- **Knowledge domains**: philosophy, theology, science, arts, history, literature, mathematics, psychology (theology separado de philosophy).
	- **Book reading**: BookReadingSystem procesa lectura, mapea "Teología" → "theology", trackea conceptos progresivamente.
	- **Concept tracking**: Set-based deduplication, almacena conceptos en readingExperiences.conceptsLearned.
	- **Visual feedback**: Point light pulsa con pulseStrength, book completion dispara flash.
- **Best practices**:
	- No mutar variables locales después del render; usar `useRef` + `useFrame`.
	- Evitar suscripciones en render; mover a `useEffect` y limpiar (`unsub()`).
	- No acceder a `ref.current` durante render (React 19 purity violation); usar state o mover lógica a effects.
	- Suscribirse a `api.position`, `api.velocity` y `api.quaternion` en `useEffect`.
	- `Select` de postprocessing requiere `enabled={boolean}` (no `null`).
	- `Outline.visibleEdgeColor` acepta número (p.ej., `0xffffff`).
	- Cejas usan `boxGeometry` (no `capsuleGeometry`) para orientación horizontal por defecto.
	- Camera lock state managed at App.tsx level, propagated to R3FCanvas and CubeList.
	- FollowCamera checks locked prop: early return cuando locked=false para deshabilitar seguimiento.

## ESLint Configuration

Uses flat config with these plugins:
- `@eslint/js` - Core JavaScript rules
- `typescript-eslint` - TypeScript-specific rules (recommended preset)
- `eslint-plugin-react-hooks` - React Hooks rules (flat config)
- `eslint-plugin-react-refresh` - Fast Refresh rules for Vite

**Important**: When adding new ESLint rules, use the flat config API with `files: ['**/*.{ts,tsx}']` pattern and `extends` array. The `dist/` folder is globally ignored.

## Important Notes

- **No React Compiler**: Intentionally disabled for dev/build performance. Don't suggest enabling unless user requests.
- **Fast Refresh**: Uses Babel-based Fast Refresh via `@vitejs/plugin-react` (not SWC variant).
- **File Extensions**: TypeScript files use `.tsx` for components, `.ts` for utilities.
- **Public Folder**: Reference public assets with leading `/` (e.g., `/vite.svg` maps to `public/vite.svg`).
- **R3F typing tips**:
	- `Outline.visibleEdgeColor` is a number (e.g., `0xffffff`), not string.
	- Prefer `hovered: boolean` for `Select.enabled`.
	- Keep `useFrame((state, delta) => ...)` side-effectful (scale, impulses), not stateful.

## When Extending the Project

- Add new components in `src/` with co-located `.css` files following the `App.tsx`/`App.css` pattern
- For type-aware linting, user can upgrade to `recommendedTypeChecked` config (see README.md)
- New dependencies should be compatible with React 19 and Vite 5+ ecosystem
- Maintain ESM-only architecture (`"type": "module"` in package.json)

### Examples to Follow
- File: `src/ui/scene/R3FCanvas.tsx`
	- Physics setup: `Physics` props and `Plane`/`Cube` bodies
	- Interaction: `selectedId`, `hopSignal`, `onPointerMissed`, `onSelect`
	- Animation: `useFrame` scale lerp, `applyImpulse` for jump
	- Renders cubes from `CUBES_CONFIG` array

- File: `src/ui/scene/components/Cube.tsx`
	- Fases de salto: `idle → squash → air → land → settle`
	- Auto-hop: programación mediante `nextHopAt`
	- Auto-enderezado: suscripción a `api.quaternion`, cálculo de tilt y `slerp` a vertical preservando yaw
	- Expresiones: `eyeStyle` (`bubble|dot`) + burbuja `Html` (estilos `ThoughtBubble.css`)
	- Mood calculation: 3-tier priority (physical phases → cognitive states → personality baseline)
	- Visual mapping: `computeVisualTargets` aplicado al material (`color/emissive/roughness/metalness`) y micro-animaciones (respiración/jitter)
	- Eyebrows: mood-based positioning and rotation passed to eye components

- File: `src/ui/scene/components/Plane.tsx`
	- Colisionadores estáticos con material (restitución/fricción) ajustado para rebote "gel-like"

- File: `src/ui/scene/objects/Books.tsx`
	- Individual `Book` components with `useBox` physics: `mass: 1`, `restitution: 0.9`, `friction: 0.1`, damping for stability
	- `Books` wrapper uses `useState(() => { ... })` initializer to generate random spawn data (position, rotation, color) once at mount
	- Complies with React 19 purity rules by avoiding `Math.random()` in render/useMemo; uses state initializer function instead
	- Spawns within sandbox bounds (configurable `sandboxSize`, `minY`, `maxY`)
	- Each book casts/receives shadows for realistic lighting

- Objects: `src/ui/scene/objects/{BubbleEyes,DotEyes}.tsx`
	- Ojos con parpadeo y mirada lerpeada; reciben `look`, `eyeScale`, y `mood` desde `Cube`
	- Cejas animadas con `boxGeometry` horizontal (args: `[width, height, depth]`)
	- Mood-based eyebrow expressions: happy (raised/arched), sad (inner raised), angry (low/furrowed), etc.
	- `useFrame` lerps eyebrow Y position and Z rotation smoothly (k=6)

- Visual: `src/ui/scene/visual/visualState.ts`
	- `computeVisualTargets(thought, personality, selected, hovered)` → objetivos visuales coherentes con estado
	- Personality base colors: calm (gray), extrovert (orange), curious (cyan), chaotic (red), neutral (gray)
	- Thought keyword overlays: "weee/!" → happy yellow, "plof/triste" → sad blue, "hmm/¿" → curious green

- UI: `src/ui/components/CubeList.tsx`
	- Sidebar styled with styled-components
	- Maps `CUBES_CONFIG` to clickable cube buttons
	- Transient props (`$selected`, `$auto`) for dynamic styling
	- Displays: ID, personality, eyeStyle, position, mode (auto/manual)

- UI: `src/ui/components/CubeList.tsx`
	- Sidebar con camera lock indicator cuando cube selected
	- Shows 🔒/🔓 icon with toggle hint "Presiona ESPACIO para..."
	- Styled with `CameraHint` component (green locked, orange free)
	- Receives `cameraLocked` prop from App.tsx

- UI: `src/ui/components/CubeFooter.tsx`
	- ReactFlow graph with central cube node
	- Emotion nodes (left), personality nodes (right), knowledge nodes (bottom), concept nodes (yellow badges)
	- Concept nodes show last 6 learned (🧩 emoji)
	- Active nodes have animated edges connecting to/from central cube
	- Uses `useMemo` to build nodes/edges, `useCallback` for handlers
	- MiniMap colors nodes based on active state
	- Panel displays cube title

- Systems: `src/ui/scene/systems/Community.ts`
	- Global Map-based registry (`cubesRegistry`)
	- Subscribe pattern with RAF throttling
	- `updateCube` detects changes in position, personality, readingExperiences (including conceptsLearned length)
	- `getCube`, `setCube`, `getAllCubes` for pub-sub access

- Systems: `src/ui/scene/systems/BookReadingSystem.ts`
	- `DOMAIN_MAPPING`: maps Spanish book categories to KnowledgeDomain
	- Processes reading progress, updates knowledge state
	- Tracks concepts progressively during reading

- Guidelines: `src/ui/scene/guidelines/instrucciones.ts`
	- `KnowledgeDomain` type with theology as separate field
	- `KnowledgeState` initializer with all domains
	- `DEFAULT_BOOK_EFFECTS` for theology domain

- Data: `src/ui/scene/data/booksLibrary.ts`
	- `BookContent` interface with `conceptos?: string[]`
	- La Biblia includes conceptos: ["Dios", "Fe", "Pecado", "Perdón", "Amor", "Esperanza"]

If adding new organisms or motions, reuse the pattern: drive phase/target via refs, schedule impulses, lerp visuals in `useFrame`, subscribe to Cannon in `useEffect`. For random generation in React 19, use `useState(() => ...)` initializer to satisfy purity constraints. For eyebrow expressions, use `boxGeometry` with width > height for horizontal orientation. For camera follow, use CameraControls with lerp smoothing and interaction detection via addEventListener.
