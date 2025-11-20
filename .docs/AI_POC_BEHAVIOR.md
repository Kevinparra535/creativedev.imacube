# AI-Driven NPC Behavior POC

## 🎯 Visión: IA como Cerebro, JS como Huesos

El código JavaScript en `Cube.tsx` y sistemas de navegación/física ahora representan la **capa física** (los "huesos"). El **cerebro** es el backend de IA local (Ollama), que determina:
- Qué hace el NPC (goal/intent)
- Cómo aprende y evoluciona (learning updates)
- Cómo expresa su estado (mood/transient effects)
- Hacia dónde va su personalidad (personality shifts)

---

## 🧠 Arquitectura Cognitiva (AI-First)

### 1. **BehaviorPlanner.service** (Nuevo)
**Propósito**: Consultar a la IA local para decidir el siguiente comportamiento del NPC.

**Flujo**:
1. Se invoca tras cada respuesta del chat con el usuario (en `AI.service.ts`)
2. Envía un **system prompt** indicando que debe devolver JSON con el esquema `BehaviorDecision`
3. Envía contexto del mundo (RAG topK=3 fragmentos), memoria del cubo (traits/facts/preferences resumidos), y posición actual
4. El modelo local responde con JSON estructurado:
   ```json
   {
     "goal": "explore",
     "intent": "move_to_book",
     "target": { "type": "book", "id": "book_001" },
     "transient": { "jump": true },
     "learning": { "addFacts": ["decidió explorar por curiosidad"] },
     "mood": "curious",
     "personalityShift": "more_curious",
     "ttlMs": 5000
   }
   ```
5. La decisión se persiste en `Community.ts` (`behaviorState`) y se ejecuta durante los siguientes N segundos (TTL).

**System prompt clave**:
- Instrucción: devolver **solo JSON**, sin texto adicional
- Esquema estricto con campos opcionales
- Personaje debe respetar su personalidad actual pero puede evolucionar sutilmente

**Integración**:
- `AI.service.ts` llama a `planBehavior(cubeId, personality, message)` tras generar la respuesta del chat
- Actualiza `Community.behaviorState` con la decisión
- Actualiza `transientAction` (jump/colorShift/lightPulse) para consumo inmediato
- Actualiza memoria del cubo (`CubeMemory.service`) si hay `learning` fields

---

### 2. **CognitionTypes.ts** (Nuevo)
**Propósito**: Define los tipos del sistema cognitivo.

**Tipos clave**:
- `BehaviorDecision`: Decisión completa con goal, intent, target, transient effects, learning, mood, personalityShift, ttlMs
- `BehaviorTarget`: Tipo de objetivo (book, cube, zone, none) con id/posición opcional
- `LearningUpdate`: Traits/facts/preferences a agregar a la memoria
- `PersonalityShift`: Sugerencias de evolución gradual de personalidad
- `TransientEffects`: Efectos one-shot (jump, colorShift, lightPulse)

---

### 3. **Community.ts** (Extendido)
**Cambios**:
- Añadido campo `behaviorState?: BehaviorDecision` a `PublicCubeState`
- Detecta cambios en `behaviorState` (goal/intent/mood) para disparar notificaciones
- Ahora almacena la última decisión cognitiva de cada cubo con TTL

**Por qué**:
- Permite que `Cube.tsx` y otros sistemas lean la decisión actual del NPC
- TTL evita que decisiones viejas se queden estancadas
- Pub/sub notifica a listeners cuando cambia el plan del NPC

---

## 🔄 Flujo Completo: Usuario → IA → Comportamiento

```mermaid
Usuario escribe mensaje
   ↓
CubeInteraction.tsx → AI.service.generateResponse()
   ↓
AI.service construye contexto:
   - RAG worldKnowledge (topK=3)
   - Memoria resumida (traits/facts/preferences)
   - Intención/emociones/conceptos extraídos
   ↓
Envía a modelo local (villager-npc / mentor-npc / trickster-npc según personalidad)
   ↓
Recibe respuesta textual del NPC
   ↓
NPCInteractionBridge deriva acciones físicas (jump/colorShift/light)
   ↓
BehaviorPlanner.planBehavior() consulta modelo nuevamente con:
   - System prompt pidiendo JSON (BehaviorDecision)
   - Contexto mundo + memoria + posición
   ↓
Recibe JSON con goal/intent/target/learning/mood/shifts
   ↓
Actualiza Community.behaviorState
   ↓
Cube.tsx lee behaviorState en useFrame:
   - Orienta navegación hacia target si existe
   - Aplica transientAction (salto/color/luz)
   - Refleja mood en cejas/expresión
   ↓
Learning updates se incorporan a CubeMemory (traits/facts)
   ↓
PersonalityShift acumula (futuro: modificar personality tras X shifts)
```

---

## 📊 Estado Actual del POC

### ✅ Implementado (Capa Cognitiva)
- [x] `BehaviorPlanner.service.ts`: solicita decisiones JSON a la IA
- [x] `CognitionTypes.ts`: tipos estructurados para decisiones
- [x] `Community.behaviorState`: almacena decisión actual del NPC
- [x] Integración en `AI.service`: llama al planner post-respuesta
- [x] Learning updates automáticos: traits/facts/preferences inyectados a memoria
- [x] TransientAction: jump/colorShift/lightPulse desde decisión IA
- [x] RAG + Memoria resumida + Contexto de mundo en cada consulta al planner

### ⚠️ Pendiente (Próximos Pasos)
- [ ] **Cube.tsx**: leer `behaviorState.target` y sesgar navegación hacia él
  - Actualmente la navegación usa `AttentionSystem` (hard-coded scoring)
  - Propuesta: si existe `behaviorState.target`, priorizar ese objetivo en lugar de escaneo autónomo
- [ ] **Mood → Eyebrows mapping**: usar `behaviorState.mood` para animar cejas
  - Ya hay sistema de moods (happy/sad/angry/curious); enlazar con campo `mood` del planner
- [ ] **PersonalityShift acumulación**: trackear shifts y modificar `personality` tras N shifts consecutivos
  - Ej: 5 "more_curious" → cambiar de "calm" a "curious"
- [ ] **TTL cleanup**: agregar limpieza automática de `behaviorState` expirado en RAF throttle
  - Evitar que decisiones caducadas persistan indefinidamente
- [ ] **Logging/debugging**: consola o UI mostrando última decisión del NPC
  - Ayuda a verificar que la IA genera decisiones coherentes

### 🗑️ Candidatos a Deprecar (Hardcoded Logic)
Con el cerebro IA activo, estos sistemas pierden relevancia o pueden simplificarse:

#### AttentionSystem.ts (Escaneo de objetivos)
**Antes**: Lógica hardcoded de scoring para elegir libro/cubo/zona según personalidad.
**Ahora**: El planner IA puede decidir directamente el objetivo basándose en contexto + memoria.
**Acción propuesta**:
- Mantener como **fallback** cuando la IA no responde o no provee target
- Simplificar scoring: solo detección básica de objetos cercanos
- Delegar la **priorización** a la IA (ella elige qué es interesante)

#### NavigationSystem.ts (Jump direction/strength)
**Antes**: Noise por personalidad, intervalos fijos.
**Ahora**: La IA puede sugerir cuándo saltar (transient.jump) y hacia dónde (target).
**Acción propuesta**:
- Mantener mecánica de salto físico (applyImpulse)
- Eliminar timer automático de saltos; la IA decide cuándo
- Usar `behaviorState.target.position` para calcular dirección

#### BookReadingSystem.ts (Progreso/efectos)
**Antes**: Hard-coded mapping de conceptos → dominios, efectos psicológicos.
**Ahora**: La IA puede inferir qué aprendió el NPC tras leer (learning.addFacts).
**Acción propuesta**:
- Mantener mecánica de lectura física (proximidad, timer)
- Eliminar extracción automática de conceptos; la IA determina qué recordar
- Flash visual y pulseStrength conservados (expresión física)

#### Visual System (`computeVisualTargets`)
**Antes**: Keyword matching en `thought` para decidir color/emissive.
**Ahora**: La IA provee `mood` directamente.
**Acción propuesta**:
- Simplificar a mapping directo: `mood → color/emissive/roughness`
- Eliminar regex de keywords; confiar en `behaviorState.mood`
- Mantener baseline por personalidad para idle state

---

## 🎮 Ejemplos de Decisiones IA (Simuladas)

### Ejemplo 1: Usuario pregunta "¿Qué libro te gustaría leer?"
**AI Response (chat)**: "Hmm... me llama la atención ese libro de filosofía cerca de ti."
**BehaviorDecision (planner)**:
```json
{
  "goal": "learn",
  "intent": "navigate_to_book",
  "target": { "type": "book", "id": "phil_003", "position": [12, 2, -8] },
  "transient": { "jump": false },
  "learning": { "addFacts": ["el usuario le sugirió leer filosofía"] },
  "mood": "curious",
  "personalityShift": "more_curious",
  "ttlMs": 8000
}
```

### Ejemplo 2: Usuario dice "¡Salta de alegría!"
**AI Response (chat)**: "¡Sííí! ¡Weee!"
**BehaviorDecision (planner)**:
```json
{
  "goal": "express_joy",
  "intent": "celebrate",
  "target": { "type": "none" },
  "transient": { "jump": true, "colorShift": "#ffcc00", "lightPulse": true },
  "learning": { "addTraits": ["le gusta celebrar con saltos"] },
  "mood": "happy",
  "personalityShift": "more_extrovert",
  "ttlMs": 3000
}
```

### Ejemplo 3: Usuario pregunta sobre otro cubo
**AI Response (chat)**: "Cube Caos... es interesante pero impredecible."
**BehaviorDecision (planner)**:
```json
{
  "goal": "socialize",
  "intent": "observe_cube",
  "target": { "type": "cube", "id": "c4" },
  "transient": {},
  "learning": { "addFacts": ["el usuario preguntó sobre Cube Caos"] },
  "mood": "neutral",
  "personalityShift": "none",
  "ttlMs": 6000
}
```

---

## 🛠️ Próximos Pasos de Implementación

### Fase 1: Conectar `behaviorState.target` a navegación (Alta prioridad)
1. En `Cube.tsx`, leer `cubeState.behaviorState?.target` desde Community
2. Si existe target con posición, calcular dirección hacia él
3. Aplicar impulso en esa dirección (reemplazar random hop con directed hop)
4. Detectar llegada: cuando distancia < threshold, marcar como "arrived" (opcional: actualizar memoria)

### Fase 2: Mood directo desde IA (Media prioridad)
1. Extender `computeVisualTargets` para aceptar `mood?: string`
2. En `Cube.tsx`, pasar `cubeState.behaviorState?.mood` a visual system
3. Eliminar regex de thought para mood (confiar en IA)
4. Mapear mood a eyebrow expression directamente

### Fase 3: PersonalityShift acumulador (Baja prioridad, experimento)
1. Trackear shifts en memoria o estado persistente (ej: `shiftHistory: string[]`)
2. Cuando se acumulan 5+ shifts hacia la misma dirección, modificar `personality` en Community
3. Re-init conversación con nuevo system prompt
4. Registrar evento en memoria ("evolucionó de calm a curious")

### Fase 4: Deprecar/simplificar sistemas legacy
1. **AttentionSystem**: reducir a "listObjects(nearbyBooks, nearbyCubes)" sin scoring
2. **NavigationSystem**: eliminar timer; solo exponer `computeJumpDirection(from, to)`
3. **BookReadingSystem**: mantener mecánica física, eliminar concept extraction (IA lo hace)
4. **VisualState**: simplificar a lookup table `mood → targets`, sin keywords

---

## 🧪 Testing & Debugging

### Verificar que el Planner funciona
1. Activar logging en `BehaviorPlanner.service.ts`:
   ```ts
   console.log("[Planner]", cubeId, decision);
   ```
2. En consola del navegador, tras cada mensaje, ver JSON de decisión
3. Confirmar que `behaviorState` se actualiza en Community (usar React DevTools o console log en `Cube.tsx`)

### Verificar que Learning se aplica
1. Inspeccionar `localStorage` clave `cube.memories`
2. Tras varias interacciones, debería haber nuevos `traits`/`facts`/`preferences`
3. Próximo chat debería incluir esos items en el contexto (ver network payload)

### Verificar que TransientAction se consume
1. Cuando la IA sugiere `jump: true`, el cubo debe saltar inmediatamente
2. `colorShift` debe aplicar tint temporal
3. `lightPulse` debe activar point light intensity boost

---

## 📦 Archivos Nuevos

- `src/systems/CognitionTypes.ts` - Tipos de decisiones cognitivas
- `src/services/BehaviorPlanner.service.ts` - Llamadas al planner IA
- `.docs/AI_POC_BEHAVIOR.md` - Este documento

## 📝 Archivos Modificados

- `src/systems/Community.ts` - Añadido `behaviorState` field, change detection
- `src/services/AI.service.ts` - Integración con `planBehavior()` post-respuesta

## 🎓 Conclusión

**Antes**: Sistemas hardcoded decidían qué hacer (AttentionSystem), cuándo saltar (NavigationSystem), qué aprender (BookReadingSystem), cómo verse (VisualState).

**Ahora**: La IA local es el cerebro que decide todo lo anterior. Los sistemas JS son executors físicos (aplicar impulso, renderizar cejas, trackear posición).

**Próximo objetivo**: Conectar target de la IA a la navegación física para que los NPCs vayan a donde la IA decide, no a donde el scoring hardcoded dicta.

---

**Resumen ejecutivo**:
> El POC transiciona de "comportamiento programado" a "comportamiento emergente guiado por IA". Cada decisión (explorar, socializar, aprender, expresar) ahora proviene de un modelo Ollama local que considera contexto, memoria, y personalidad. El código JavaScript se convierte en la capa de actuación física, no la fuente de decisión.
