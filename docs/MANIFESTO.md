# Creative Manifesto

> "Cubo como Cuerpo, IA como Cerebro" — The sandbox treats each cube as a living vessel whose physical presence, micro–animations, and spatial experiences form the sensory layer. The AI (local-first) acts as an internal reflective process. Identity emerges only from repeated loops of sensation → reflection → adaptation.

## Core Principles

1. Embodied Emergence: No preloaded wisdom. Cubes begin naïve; knowledge, skills, and personality shifts arise from local interactions (reading proximity, movement patterns, conversations).
2. Minimal Seed → Organic Growth: Start with tiny skill values and a lean memory. Complexity must accumulate visibly (graphs, color shifts, subtle behavioral variance).
3. Physiology Drives Cognition: Physical states (idle, squash, air, land, tilt) gate certain thoughts & emotional overlays; the body is not decorative — it modulates the mind.
4. Local-First Autonomy: The system prefers local AI (Ollama) to keep latency low and experimentation rapid. Cloud or larger models are optional, never central.
5. Context Layers (Working → Episodic): Memory remains lightweight in the POC. Rich synthesis layers are deferred until emergent signals justify them.
6. Ethical Neutrality & Gentle Evolution: Personality drift is directional but not judgmental. Exposure shapes tendencies (e.g., philosophy → calm) without moral scoring.
7. Slow Skill Accretion: Skills change in microscopic deltas to emphasize passage of time and accumulation rather than instant upgrades.
8. Visual Honesty: Every visual effect (glow, pulse, jitter, breathing) maps to an internal state change (learning pulse, confusion wobble, chaotic jitter). No purely ornamental animations.
9. Dispersed Social Ecology: Anti-clumping forces preserve spatial diversity; learning can be observed simultaneously across the sandbox.
10. Iterative Extension: Advanced systems (RAG lore, memory synthesis, multi-model archetypes) are modular, reintroduced only when the base loop feels mature.

## Design Promises

- If nothing happens, nothing evolves. No hidden timers fabricating growth.
- Reading requires genuine proximity and linger — knowledge acquisition is earned.
- Personality changes are narratively hinted ("Me siento más calm") before being structurally applied.
- AI dialogue never contradicts physical constraints (no omniscient world lore in POC).

## Evolution Roadmap (Conceptual)

| Phase | Focus | Unlocks |
|-------|-------|---------|
| Seed | Movement + Near-book reading | Basic knowledge bars, skill microdeltas |
| Social | Interaction hints & shared learning | Trait badges, cooperative capability unlocking |
| Reflection | Episodic synthesis layer | Core beliefs, meta-goals, identity timeline |
| Specialization | Domain saturation | Visual domain auras, skill plateaus, archetype modulation |
| Story | Long-running goal chains | Narrative threads, memory decay/regeneration |

## Manifesto to Code Mapping

| Principle | Implementation Touchpoints |
|-----------|----------------------------|
| Embodied Emergence | `Cube.tsx` phases; separation steering; passive reading radius |
| Physiology Drives Cognition | Thought text changes on jump phases; learning pulse boosts emissive |
| Slow Skill Accretion | `updateCubeMemory(skillUpdates)` tiny increments ≤0.005 |
| Visual Honesty | `computeVisualTargets` + state-dependent overlays in frame loop |
| Dispersed Ecology | `getNeighbors` + inverse-square repulsion before navigation logic |
| Local-First Autonomy | `AI.service.ts` simplified prompt; fallback templates |
| Minimal Memory | `CubeMemory.service.ts` working & episodic only |
| Ethical Neutrality | Personality drift counters based on domain exposure; no scoring |
| Iterative Extension | Removed synthesis/NPC bridge/RAG; documented future reintroduction |

## Creative North Star

A cube that starts mute, colorless, and directionally aimless — and over time becomes distinctly patterned in movement cadence, tonal responses, learned domain emphasis, and soft personality gradients, all without hard-coded "character scripts". The player should be able to say: *"This one feels extrovert and artistic"* purely from watching it, **before** reading any debug panel.

---
Feel free to extend this manifesto. Keep additions grounded in observable behaviors, not abstract narrative unless tied to future code hooks.
