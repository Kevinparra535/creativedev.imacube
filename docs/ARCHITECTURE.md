# Architecture Overview

## High-Level Loop

```
[Physics & Environment] → [Sensory State] → [Memory Update] → [AI / Template Thought] → [Behavior / Personality Drift] → (repeat)
```

## Core Runtime Loops

### 1. Idle / Wander Loop
- Steering: Continuous target velocity steering (`desiredDirRef`) with periodic direction refresh.
- Anti-Clumping: Inverse-square repulsion + wall avoidance each frame.
- Expressive Hops: Timed squash/air/land phases overlay the smooth drift for liveliness.
- Orientation: Yaw aligns to velocity or intended direction; eyes always on +Z.

### 2. Navigation Loop
- Trigger: Target selected by attention scan (`scanForTargets`).
- Movement: Impulse jumps toward `targetPosition` until arrival conditions (distance + low velocity). Transition to observing.
- Rotation: Delta-scaled slerp based on personality turn speed.

### 3. Passive Reading Loop
- Activation: Proximity < 4 units to nearest book and linger > 0.6s.
- Tick: Every ~1s increments small domain knowledge + micro skill updates.
- Personality Drift: Exposure counters per domain; thresholds trigger shifts.

### 4. Active Reading (Book System)
- When navigation target is a book with accepted content, uses reading progress accumulation (`readingState`).
- Emotions & Concepts: Derived per progress slice; pulse strength modulated on strong emotions.
- Capability Unlock: Navigation/self-righting progress accelerated if reading relevant domains.

### 5. Self-Righting Loop
- Tilt Detection: Quaternion-derived up vector; tilt > threshold triggers upright target quaternion.
- Correction: Slerps yaw-preserving orientation; learning progress from tilt experiences unlocks capability.

### 6. Autonomous Thinking Loop
- Interval: Personality-dependent ms window (10–40s).
- Action: Calls `performAutonomousTick` (AI/template) to produce reflective intent/mood/personality shift suggestions.
- Integration: Behavior state stored in registry; mood influences eyebrow and visual targets.

### 7. Conversation Loop
- User Message: Intent + concept extraction; memory update (working/episodic); optional AI generation.
- Response: Thought displayed with duration scaling by personality; learning pulse overlay for visual feedback.

## State Layers

| Layer | Purpose | Storage | Frequency |
|-------|---------|---------|-----------|
| Working | Recent messages, current emotion/activity | In-memory/localStorage (simplified) | Per interaction |
| Episodic | Events (reading ticks, emotions, capability unlocks) | LocalStorage | Periodic | 
| Core (Deferred) | Beliefs, meta-goals, philosophy statement | Removed in POC | Future synthesis |

## Personality Drift Mechanism
- Counters per domain category increment on exposure.
- Threshold (passive > active) triggers mapping table: philosophy/theology → calm; science/math/tech → neutral; art/music/literature → extrovert.
- Drift resets domain counter for fairness; emotional thought text narrates transition.

## Skills Evolution
- Representation: Six floats [0,1]: social, empathy, assertiveness, curiosity, creativity, logic.
- Update Sources: Passive reading microdeltas; active reading; planner/autonomous decisions.
- Visualization: ReactFlow radial nodes with percentage fill.

## Community Registry
- Map-based state store with RAF-throttled notifications.
- Change Detection: Position, personality, capabilities, skills, learningProgress, knowledge, readingExperiences, behaviorState, transientAction, modifiers.
- Consumption: `useCommunityCubes` hook merges dynamic runtime with static config for UI.

## Visual Mapping
- `computeVisualTargets(thought, personality, selected, hovered)` → base material (color, emissive, roughness, metalness, breathing/jitter amplitudes).
- Overlays: Modifiers (sarcastic, shy, philosophical, etc.) and pulses (learning, emotion).

## Separation & Steering
- Force Application: Inverse-square repulsion per neighbor (radius ~ desiredSeparation + 2). Continuous steering avoids velocity spikes.
- Bounds: Soft push inward when |x| or |z| > bound.

## Removed / Deferred Systems (Pseudonodes for Future Integration)
- Memory Synthesis (episodes → core identity consolidation).
- NPC Interaction Bridge (LLM-action mapping to transientAction).
- RAG Knowledge Base (sandbox lore injection).
- Multi-Model Archetypes (villager/mentor/trickster models).

## Extension Points
| Area | Hook | Future Feature |
|------|------|----------------|
| Synthesis | `maybeSynthesize()` (deleted) | Belief/worldview evolution |
| Actions | `transientAction` | Rich gestures, light patterns |
| Knowledge | `knowledge` object | Domain saturation triggers | 
| Goals | (delayed) | Multi-step quest chains | 
| Traits | `traitsAcquired` | UI trait badges & influence loops |

## Data Flow (Conversation Example)
```
User Input → InteractionSystem.analyzeIntent → Memory update → AI.service.generateResponse → Thought display → Skill/context adjust → Registry broadcast → UI re-render
```

## Data Flow (Passive Reading Example)
```
Proximity check (<4u) & linger → readingTick loop → knowledge[domain]++ + skill microdelta → personality drift counters++ → optional drift change → registry update → ReactFlow nodes animate
```

## Performance Notes
- RAF throttling prevents excessive re-renders on minor state changes.
- Random generation restricted to `useState(()=> ...)` initializers for React 19 purity.
- Material updates batched per frame inside `useFrame` to avoid diff noise.

## Glossary
- Linger: Time spent continuously within passive read radius.
- Drift Counter: Per-domain exposure tally controlling potential personality shift.
- Pulse: Temporary emissive/scale boost signaling internal change (learning/emotion).
- Capability: Learned mechanical skill (navigation, self-righting) independent from soft skills.

---
Refer also to `MANIFESTO.md` for philosophical context guiding architectural choices.
