# Copilot Instructions for creativedev.imacube

## Project Overview

Interactive 3D sandbox with AI-powered NPCs (cubes) that learn, explore, and communicate. Built with React 19 + R3F + Cannon physics + local AI (Ollama) + dynamic memory system. Each cube has personality, visual expressions, autonomous navigation, and evolving memory through conversations.

## Key Architecture Decisions

- **Rolldown Integration**: Uses `rolldown-vite@7.2.2` (not standard Vite) enforced via `package.json` overrides
- **React 19 Purity**: All random generation MUST use `useState(() => ...)` initializer, never in render/useMemo
- **ESM-only**: `"type": "module"` in package.json; use `import type` for TypeScript types
- **Flat ESLint**: Uses `eslint.config.js` (not `.eslintrc`) with `globalIgnores: ['dist/']`
- **Physics**: Cannon bodies via `@react-three/cannon`; subscribe to APIs in `useEffect`, apply forces in `useFrame`
- **Community Registry**: Centralized pub-sub state in `src/systems/Community.ts` with RAF throttling + change detection
- **AI Layer**: Multi-model local-first (Ollama) with personality→archetype→model mapping (`npcArchetypes.ts`)
- **Dynamic Memory**: Per-cube persistent memory (traits/facts/preferences) evolves with each conversation
- **Behavior Planning**: Separate LLM-powered planner (`BehaviorPlanner.service.ts`) returns JSON decisions with TTL
- **RAG Knowledge Base**: 30+ world facts in `worldKnowledge.ts` for context-aware responses

## Critical Data Flow Patterns

### NPC Conversation Pipeline
1. **User input** → `CubeInteraction.tsx` (UI)
2. **Intent analysis** → `InteractionSystem.ts` extracts concepts/emotions
3. **Memory retrieval** → `CubeMemory.service.ts` loads traits/facts from localStorage
4. **RAG context** → `worldKnowledge.ts` injects relevant sandbox knowledge
5. **Archetype selection** → `npcArchetypes.ts` maps personality→model (villager/mentor/trickster)
6. **AI request** → `AI.service.ts` sends enriched prompt to local Ollama (or OpenAI fallback)
7. **Response parsing** → `NPCInteractionBridge.service.ts` derives actions (jump/colorShift/emotion)
8. **Behavior planning** → `BehaviorPlanner.service.ts` (parallel) generates JSON decision with TTL
9. **State update** → `Community.updateCube()` triggers RAF-throttled notification
10. **Visual response** → `Cube.tsx` consumes transientAction + behaviorState + activeModifiers

### Physics Subscription Pattern (React 19 compliant)
```tsx
// ❌ WRONG - ref access during render
const [ref, api] = useBox(() => ({ mass: 1 }));
const pos = api.position.get(); // React 19 purity violation

// ✅ CORRECT - subscribe in useEffect
const posRef = useRef<[number, number, number]>([0, 0, 0]);
useEffect(() => {
  const unsub = api.position.subscribe(v => { posRef.current = v; });
  return unsub;
}, [api]);
```

### Community Registry Change Detection
Only notifies subscribers when these fields change:
- `position`, `personality`, `socialTrait`, `capabilities`
- `learningProgress`, `knowledge`, `readingExperiences.conceptsLearned`
- `activeModifiers`, `transientAction`, `behaviorState`

Deep comparison for arrays (e.g., conceptsLearned length check).

## Development Workflows

### Running Locally
```pwsh
npm run dev          # Frontend on :5173
cd server && npm start  # Ollama proxy on :3001 (required for AI)
ollama serve         # Ollama on :11434 (backend for proxy)
```

### Setting Up Local AI (Required for Conversations)
```pwsh
ollama pull llama3.1
ollama create villager-npc -f server/models/Modelfile.villager
ollama create mentor-npc -f server/models/Modelfile.mentor
ollama create trickster-npc -f server/models/Modelfile.trickster
```

### Environment Variables (.env)
```env
VITE_AI_BACKEND=local  # or "openai"
VITE_LOCAL_AI_URL=http://localhost:3001/api/chat
VITE_LOCAL_AI_MODEL=llama3.1  # fallback if archetype models missing
```

### Build Process
`npm run build` → `tsc -b` (type check) → `vite build` (both must pass)

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

### React 19 Random Generation Pattern
```tsx
// ❌ WRONG - violates purity constraints
const Books = () => {
  const count = useMemo(() => Math.random() * 10, []); // Impure initializer
  // ...
}

// ✅ CORRECT - use useState initializer
const Books = () => {
  const [positions] = useState(() => 
    Array.from({ length: 20 }, () => [
      Math.random() * 60 - 30,
      Math.random() * 10 + 5,
      Math.random() * 60 - 30,
    ])
  );
}
```

### Community Update Pattern
```tsx
// Always use updateCube() for state changes - triggers RAF-throttled notifications
import { updateCube } from '../systems/Community';

updateCube(cubeId, {
  position: [x, y, z],
  readingExperiences: {
    ...existing,
    conceptsLearned: [...existing.conceptsLearned, 'Dios', 'Fe']
  }
});
```

### Memory Evolution Pattern
```tsx
import { updateCubeMemory, extractMemoryFromMessage } from './CubeMemory.service';

// After AI response, update memory with new learnings
const memoryUpdate = extractMemoryFromMessage(userMessage, intent);
updateCubeMemory(cubeId, {
  ...memoryUpdate,
  addTraits: ['está aprendiendo sobre filosofía'],
  addFacts: [`el jugador mencionó "${keyword}"`]
});
```

### R3F Scene Structure (3D)
- **Scene file**: `src/ui/scene/R3FCanvas.tsx`
- **Components**: `src/ui/scene/components/Cube.tsx`, `src/ui/scene/components/Plane.tsx`
- **Config**: `src/ui/scene/cubes.config.ts` (centralized cube configuration array)
- **Objects**: `src/ui/scene/objects/{BubbleEyes,DotEyes}.tsx` (ojos intercambiables por props con cejas animadas), `src/ui/scene/objects/Books.tsx` (libros físicos aleatorios)
- **Visual**: `src/ui/scene/visual/visualState.ts` (mapea personalidad/estado → material y micro-animaciones)
- **UI Components**: 
  - `src/ui/components/CubeInteraction.tsx` (chat panel en aside izquierdo)
  - `src/ui/components/CubeList.tsx` (tabs horizontales en footer)
  - `src/ui/components/CubeFooter.tsx` (footer wrapper con tabs + ReactFlow)
	- `src/ui/components/AIStatus.tsx` (indicador estado de IA top-right)
- **Styles**: 
  - `src/ui/styles/CubeInteraction.styles.ts` (chat panel + camera hint)
  - `src/ui/styles/CubeList.styles.ts` (tabs horizontales)
  - `src/ui/styles/CubeFooter.styles.ts` (footer + ReactFlow theme)
	- `src/ui/styles/AIStatus.styles.ts` (status panel IA)
  - `src/ui/styles/ThoughtBubble.css` (legacy CSS para burbujas)
- **Sandbox geometry**: 6 `Plane` bodies forming a closed cube; `Cube` bodies inside.
- **Physics config**: `Physics` node with `gravity`, `defaultContactMaterial` (tuned `restitution`, `friction`, `contactEquationRelaxation` for springy collisions).
- **Materials**: Dynamic restitution/friction on cubes/planes to achieve bouncy, "gel-like" feel.
- **Books**: Individual physics bodies (`useBox`) spawned randomly within sandbox bounds; uses `useState` initializer to generate random positions/rotations/colors once at mount (React 19 purity compliance).
- **Postprocessing**: `EffectComposer` + `Outline` for hover/selection highlight.


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

- UI: `src/ui/components/CubeInteraction.tsx` (Chat Panel - Aside Izquierdo)
	- Panel fijo izquierdo (400px width, full height)
	- Header con nombre del cubo + personalidad
	- Conversación completa con scroll automático
	- Camera hint (🔒/🔓) mostrando estado de cámara + hint "Presiona TAB para..."
	- Input de texto + botón enviar
	- Thinking indicator (3 puntos animados)
	- Styled with glassmorphism effect

- UI: `src/ui/components/CubeList.tsx` (Tabs Horizontales - Footer Top)
	- Tabs horizontales con scroll
	- Maps `CUBES_CONFIG` to clickable tabs
	- Cada tab muestra: nombre + personalidad
	- Tab activo resaltado en azul
	- Transient props (`$selected`) for dynamic styling

- UI: `src/ui/components/CubeFooter.tsx` (Footer Wrapper)
	- Contiene `CubeList` (tabs) arriba + ReactFlow abajo
	- ReactFlow graph with central cube node
	- Emotion nodes (left), personality nodes (right), knowledge nodes (bottom), concept nodes (yellow badges)
	- Concept nodes show last 6 learned (🧩 emoji)
	- Active nodes have animated edges connecting to/from central cube
	- Uses `useMemo` to build nodes/edges, `useCallback` for handlers
	- MiniMap colors nodes based on active state
	- Panel displays cube title
	- Left offset (400px) to avoid overlap with chat panel

- UI: `src/ui/components/AIStatus.tsx` (OpenAI Status - Top Right)
	- Fixed panel top-right con glassmorphism
	- Shows green (configured) or red (not configured) indicator
	- Displays current mode: "AI" or "Template"
	- Toggle button to switch between modes
	- Disabled state when no API key configured

- Systems: `src/systems/Community.ts`
	- Global Map-based registry (`cubesRegistry`)
	- Subscribe pattern with RAF throttling
	- `updateCube` detects changes in position, personality, readingExperiences (including conceptsLearned length)
	- `getCube`, `setCube`, `getAllCubes` for pub-sub access

- Systems: `src/systems/AttentionSystem.ts`
	- Escaneo de objetivos con pesos por personalidad
	- Cálculo de interés: base weight + novelty bonus - visit penalty × distance factor
	- Boredom thresholds: chaotic (4s), extrovert (8s), neutral (10s), curious (12s), calm (15s)
	- Memory tracking: historial de visitas, timestamps, visit counts

- Systems: `src/systems/NavigationSystem.ts`
	- Jump direction computation con ruido según personalidad
	- Jump strength y interval personalizados (calm: 2.8/2.5s, chaotic: 4.0/0.8s)
	- Orientation computation preservando yaw, solo rotación Y
	- Arrival detection: distancia + velocidad

- Systems: `src/systems/BookReadingSystem.ts`
	- `DOMAIN_MAPPING`: maps Spanish book categories to KnowledgeDomain
	- Processes reading progress, updates knowledge state
	- Tracks concepts progressively during reading

- Services: `src/services/AI.service.ts`
	- Singleton de conversación por cubo; local-first (URL/model configurables)
	- Prompts por personalidad; historial (10 mensajes); enriquecimiento de contexto

- Systems: `src/systems/InteractionSystem.ts`
	- Template-based response fallback
	- Intent analysis, concept extraction
	- Visual effects generation

- Guidelines: `src/ui/scene/guidelines/instrucciones.ts`
	- `KnowledgeDomain` type with theology as separate field
	- `KnowledgeState` initializer with all domains
	- `DEFAULT_BOOK_EFFECTS` for theology domain

- Data: `src/data/booksLibrary.ts`
	- `BookContent` interface with `conceptos?: string[]`
	- La Biblia includes conceptos: ["Dios", "Fe", "Pecado", "Perdón", "Amor", "Esperanza"]

## Configuration Files

- Config: `src/config/cubes.config.ts`
	- 5 cubos con posiciones dispersas para fomentar exploración:
	  - c1 (Cube Zen): [-30, 8, -30] calm/bubble
	  - c2 (Cube Social): [30, 7, -30] extrovert/dot
	  - c3 (Cube Curioso): [-30, 6, 30] curious/bubble
	  - c4 (Cube Caos): [30, 9, 30] chaotic/dot
	  - c5 (Cube Neutro): [0, 5, 0] neutral/bubble
	- Spawns en esquinas para evitar clumping inicial

- Config: `src/config/ai.config.ts`
	- Backend: `VITE_AI_BACKEND` (`local` por defecto | `openai`)
	- Local: `VITE_LOCAL_AI_URL` (default `http://localhost:3001/api/chat`), `VITE_LOCAL_AI_MODEL` (default `llama3.1`)
	- OpenAI opcional: `VITE_OPENAI_API_KEY`, `VITE_OPENAI_MODEL`, tokens/temperature
	- `isOpenAIConfigured()` devuelve true si backend es `local` (no requiere API key)

When implementing cube behavior, follow this pattern to prevent clustering:

```tsx
// In useFrame, before navigation logic:
// 1. Separation steering (repel nearby cubes)
const neighbors = getNeighbors(id, cubePos.current, desiredSeparation + 2);
let repelX = 0, repelZ = 0;
for (const nb of neighbors) {
  const dx = cubePos.current[0] - nb.position[0];
  const dz = cubePos.current[2] - nb.position[2];
  const d2 = dx * dx + dz * dz;
  if (d2 > 0.0001) {
    const inv = 1 / d2; // inverse-square falloff
    repelX += dx * inv;
    repelZ += dz * inv;
  }
}

// 2. Wall avoidance (steer toward center when near bounds)
if (Math.abs(cubePos.current[0]) > bound) repelX += cubePos.current[0] > 0 ? -0.5 : 0.5;
if (Math.abs(cubePos.current[2]) > bound) repelZ += cubePos.current[2] > 0 ? -0.5 : 0.5;

// 3. Apply continuous force (frame-rate independent)
const mag = Math.hypot(repelX, repelZ);
if (mag > 0.0001) {
  const nx = (repelX / mag) * sepBase;
  const nz = (repelZ / mag) * sepBase;
  api.applyForce([nx * delta, 0, nz * delta], [0, 0, 0]);
}

// 4. Filter social targets by distance (only >10u to avoid clustering)
if (dist > 10) {
  explorationTargets.push({ object, type: "cube" });
}
```

If adding new organisms or motions, reuse the pattern: drive phase/target via refs, schedule impulses, lerp visuals in `useFrame`, subscribe to Cannon in `useEffect`. For random generation in React 19, use `useState(() => ...)` initializer to satisfy purity constraints. For eyebrow expressions, use `boxGeometry` with width > height for horizontal orientation. For camera follow, use CameraControls with lerp smoothing and interaction detection via addEventListener. For exploration behavior, always apply separation forces and filter nearby targets to prevent clumping.