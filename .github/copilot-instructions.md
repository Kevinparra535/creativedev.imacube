# Copilot Instructions for creativedev.imacube

## Project Overview

React 19.2 + TypeScript + Vite (via `rolldown-vite` override). Modern ESM, strict TS, flat ESLint. Includes a Three.js scene powered by React Three Fiber with physics, postprocessing, thought bubbles, cartoon eyes, and self-righting cubes.

## Key Architecture Decisions

- **Rolldown Integration**: Uses `rolldown-vite@7.2.2` instead of standard Vite for improved build performance. This is enforced via `package.json` overrides.
- **React 19**: Running the latest React with new features like `react-jsx` transform and enhanced StrictMode.
- **Flat ESLint Config**: Uses the new flat config format (`eslint.config.js`) with `defineConfig` and `globalIgnores` - avoid legacy `.eslintrc` patterns.
- **TypeScript Project References**: Uses composite config with `tsconfig.app.json` (app code) and `tsconfig.node.json` (build tooling).
- **3D Scene & Physics**: `@react-three/fiber` + `@react-three/cannon` for physics, `@react-three/drei` helpers, and `@react-three/postprocessing` for outlines/selection.

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
- **Styles**: `src/ui/scene/ThoughtBubble.css` (desde componentes: `import "../ThoughtBubble.css"`)
- **Sandbox geometry**: 6 `Plane` bodies forming a closed cube; `Cube` bodies inside.
- **Physics config**: `Physics` node with `gravity`, `defaultContactMaterial` (tuned `restitution`, `friction`, `contactEquationRelaxation` for springy collisions).
- **Materials**: Dynamic restitution/friction on cubes/planes to achieve bouncy, “gel-like” feel.
- **Postprocessing**: `EffectComposer` + `Outline` for hover/selection highlight.

### Interaction & Animation Pattern
- **Selection**: Parent tracks `selectedId` and passes `selected` + `onSelect` to each `Cube`. Click selects; click vacío (`onPointerMissed`) deselecciona.
- **Manual hop test**: Parent listens to `Space` and increments a `hopSignal` counter; `Cube` detects changes to trigger jump when `selected`.
- **Squash & Stretch**: `Cube` uses `useFrame` to lerp `scale` toward phase targets:
	- Pre-salto: `[1.25, 0.75, 1.25]`
	- En aire: `[0.9, 1.1, 0.9]`
	- Aterrizaje: `[1.3, 0.7, 1.3]` → luego ` [1,1,1]`
- **Impulso físico**: `api.applyImpulse([dx, 3.2, dz], [0,0,0])` con `dx/dz` aleatorios (en modo auto) o sólo al presionar espacio (modo test).
- **Self-righting (auto-enderezado)**: Suscríbete a `api.quaternion`, calcula el `tilt` mediante el up-vector (`acos(up.y)`), genera un objetivo vertical preservando yaw y aplica `Quaternion.slerp` con amortiguación de `angularVelocity` para estabilizar.
- **Best practices**:
	- No mutar variables locales después del render; usar `useRef` + `useFrame`.
	- Evitar suscripciones en render; mover a `useEffect` y limpiar (`unsub()`).
	- Suscribirse a `api.position`, `api.velocity` y `api.quaternion` en `useEffect`.
	- `Select` de postprocessing requiere `enabled={boolean}` (no `null`).
	- `Outline.visibleEdgeColor` acepta número (p.ej., `0xffffff`).

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

- File: `src/ui/scene/components/Cube.tsx`
	- Fases de salto: `idle → squash → air → land → settle`
	- Auto-hop: programación mediante `nextHopAt`
	- Auto-enderezado: suscripción a `api.quaternion`, cálculo de tilt y `slerp` a vertical preservando yaw
	- Expresiones: ojos cartoon + burbuja `Html` con estilos de `ThoughtBubble.css`

- File: `src/ui/scene/components/Plane.tsx`
	- Colisionadores estáticos con material (restitución/fricción) ajustado para rebote “gel-like”

If adding new organisms or motions, reuse the pattern: drive phase/target via refs, schedule impulses, lerp visuals in `useFrame`, subscribe to Cannon in `useEffect`.
