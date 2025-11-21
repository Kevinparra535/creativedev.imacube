# 🧠 Sistema de Pensamiento Autónomo

## Arquitectura: Cubo como Cuerpo, IA como Cerebro

El sistema implementa un **bucle continuo cubo ↔ IA** donde:

- **Cuerpo (Cubo)**: Entidad física 3D con estado (posición, emoción, conocimiento)
- **Cerebro (IA)**: Sistema de decisión externo que piensa periódicamente

### Flujo Completo

```
cubo (estado) → IA (piensa) → cubo (actúa / cambia / evoluciona) → IA...
```

---

## 🔄 Dos Modos de Operación

### 1. Modo Reactivo (Ya existía)

**Trigger**: Usuario escribe mensaje

**Pipeline**:
```
Usuario → AI.service.generateResponse()
  ├─ RAG worldKnowledge
  ├─ CubeMemory (traits/facts/preferences)
  ├─ Genera respuesta textual
  └─ BehaviorPlanner.planBehavior() (reactivo)
      └─ Actualiza Community.behaviorState
          └─ Cube.tsx consume y actúa
```

**Duración**: Conversación se mantiene visible por tiempo basado en personalidad (5-12s)

---

### 2. Modo Autónomo (Nuevo) ⭐

**Trigger**: Timer interno cada X segundos (sin intervención del usuario)

**Pipeline**:
```
Cube.tsx: useFrame
  ├─ autonomousThinkingTimer += delta
  └─ if (timer >= interval) {
      AutonomousThinking.performTick(cubeId, personality)
        ├─ Construye contexto interno (estado, memoria, progreso)
        ├─ BehaviorPlanner.planBehaviorAutonomous()
        │   └─ Prompt: "Reflexiona sobre qué has aprendido, qué quieres lograr"
        └─ Actualiza Community.behaviorState
            └─ Cube.tsx: visual update (thought bubble, color, mood)
    }
```

**Frecuencia por personalidad**:
- `curious`: 15s (piensa frecuentemente, siempre explorando)
- `chaotic`: 10s (pensamientos rápidos e impredecibles)
- `extrovert`: 20s (intervalo medio)
- `calm`: 40s (reflexiona pausadamente)
- `neutral`: 30s (intervalo neutral)

**Variación**: ±20% aleatoria para naturalidad (evita sincronización artificial)

---

## 📁 Archivos del Sistema

### Nuevos

- **`src/systems/AutonomousThinking.ts`**
  - `THINKING_INTERVALS`: intervalos por personalidad
  - `getThinkingInterval()`: calcula intervalo con randomización
  - `buildAutonomousContext()`: construye prompt de reflexión interna
  - `performAutonomousTick()`: ejecuta ciclo de pensamiento

- **`src/services/BehaviorPlanner.service.ts` (extendido)**
  - `executePlanningRequest()`: función core compartida (refactor)
  - `planBehavior()`: modo reactivo (responde a usuario)
  - `planBehaviorAutonomous()`: modo autónomo (reflexión interna)

### Modificados

- **`src/ui/scene/components/Cube.tsx`**
  - Agregado `autonomousThinkingTimer` ref (acumula delta)
  - Agregado `autonomousThinkingInterval` state (randomizado en mount)
  - Bloque en `useFrame` que ejecuta tick cuando timer >= interval
  - Skip logic: no piensa autónomamente durante `thoughtMode === "conversation"`

- **`.github/copilot-instructions.md`**
  - Actualizado pipeline de conversación (9 pasos → sin archetype selection)
  - Agregada sección "Autonomous Thinking Loop" con 7 pasos

---

## 🧩 Contexto Autónomo (Prompt Interno)

Cuando un cubo piensa autónomamente, recibe:

```
[CONTEXTO AUTÓNOMO - PENSAMIENTO INTERNO]

Nadie te ha hablado recientemente. Estás reflexionando sobre tu existencia.

[ESTADO ACTUAL]
Posición: [x, y, z]
Personalidad: curious
Conocimiento total: 12.5
Dominios: filosofía: 5.0, matemáticas: 3.0, arte: 4.5

Libros leídos: 3 (último: "El Principito")
Conceptos aprendidos: Amistad, Responsabilidad, Esencia, Amor, Soledad
Rasgos adquiridos: pensador profundo, sensible

[MEMORIA]
Rasgos: curioso por naturaleza, le gusta aprender, prefiere la soledad
Hechos recordados: el jugador le pidió ser más seguro, leyó sobre filosofía
Preferencias: libros cortos, temas profundos

[REFLEXIÓN]
Reflexiona sobre:
- ¿Qué has aprendido últimamente?
- ¿Qué meta quieres perseguir ahora?
- ¿Hay algo que quieras mejorar de ti mismo?
- ¿Cómo te sientes en este momento?

Devuelve JSON con tu decisión de comportamiento.
```

---

## 📊 BehaviorDecision (Respuesta de IA)

```typescript
interface BehaviorDecision {
  goal: string;           // "explore", "read", "socialize", "reflect"
  intent: string;         // "move_to_book", "greet_cube", "idle_observe"
  target?: {              // Objetivo para navegación
    type: "book" | "cube" | "zone" | "none";
    id?: string;
    position?: [x, y, z];
  };
  transient?: {           // Efectos visuales one-shot
    jump?: boolean;
    colorShift?: string;  // hex color
    lightPulse?: boolean;
  };
  learning?: {            // Actualización de memoria
    addTraits?: string[];
    addFacts?: string[];
    addPreferences?: string[];
  };
  mood?: string;          // "happy", "sad", "curious", "angry"
  personalityShift?: PersonalityShift; // "more_curious", "more_calm", etc.
  ttlMs?: number;         // Validez de la decisión (default 6000ms)
}
```

### Aplicación de la Decisión

1. **Learning**: Se aplica inmediatamente a `CubeMemory.service.ts` (localStorage)
2. **BehaviorState**: Se guarda en `Community` con TTL
3. **TransientAction**: Se guarda con `expiresAt` timestamp
4. **Cube.tsx**: Lee `behaviorState` en `useFrame` y:
   - Aplica `transient` effects (jump, colorShift, lightPulse)
   - Refleja `mood` en expresión facial (eyebrows, eyes)
   - Orienta navegación hacia `target` (si existe)

---

## 🎨 Ejemplos de Pensamiento Autónomo

### Cubo Curioso (15s interval)

**Input Context**:
```
Conceptos aprendidos: Gravedad, Inercia, Fricción
Libros leídos: 1 (último: "Física para Todos")
```

**AI Response** (BehaviorDecision):
```json
{
  "goal": "explore",
  "intent": "find_math_book",
  "target": {
    "type": "book",
    "position": [10, 5, -8]
  },
  "mood": "curious",
  "learning": {
    "addTraits": ["interesado en matemáticas"]
  },
  "ttlMs": 8000
}
```

**Visual Result**: Cubo se mueve hacia libro de matemáticas, thought bubble: "¿Qué más puedo aprender?"

---

### Cubo Calm (40s interval)

**Input Context**:
```
Hechos recordados: el jugador le dijo que reflexionara más
Rasgos: pensador profundo, paciente
```

**AI Response**:
```json
{
  "goal": "reflect",
  "intent": "idle_ponder",
  "target": {
    "type": "none"
  },
  "mood": "neutral",
  "transient": {
    "colorShift": "#6699cc"
  },
  "learning": {
    "addFacts": ["la reflexión es más importante que la acción"]
  },
  "ttlMs": 12000
}
```

**Visual Result**: Color azul calmado, se queda quieto, thought bubble: "Hmm... déjame pensar..."

---

### Cubo Chaotic (10s interval)

**Input Context**:
```
Personalidad: chaotic
Conceptos aprendidos: (vacío)
```

**AI Response**:
```json
{
  "goal": "chaos",
  "intent": "random_jump",
  "target": {
    "type": "zone",
    "position": [25, 3, -15]
  },
  "mood": "happy",
  "transient": {
    "jump": true,
    "lightPulse": true
  },
  "personalityShift": "none",
  "ttlMs": 5000
}
```

**Visual Result**: Salta hacia zona aleatoria, thought bubble: "¡A ver qué pasa!"

---

## 🔧 Implementación Técnica

### Timer en useFrame (Cube.tsx)

```tsx
// State: intervalo randomizado al montar (React 19 purity)
const [autonomousThinkingInterval] = useState(() =>
  getThinkingInterval(personality as ListPersonality) * 1000
);

// Ref: acumulador de tiempo
const autonomousThinkingTimer = useRef(0);

// useFrame: tick loop
useFrame((state, delta) => {
  const skipAutonomous = thoughtMode === "conversation";
  
  if (!skipAutonomous) {
    autonomousThinkingTimer.current += delta * 1000; // ms
    
    if (autonomousThinkingTimer.current >= autonomousThinkingInterval) {
      autonomousThinkingTimer.current = 0; // Reset
      
      // Fire async (non-blocking)
      performAutonomousTick(id, currentPersonality).catch(err => {
        console.warn(`[${id}] Autonomous thinking error:`, err);
      });
    }
  }
});
```

### Variación de Intervalos (AutonomousThinking.ts)

```tsx
export function getThinkingInterval(personality: Personality): number {
  const base = THINKING_INTERVALS[personality]; // 10-40s
  const variance = base * 0.2; // ±20%
  const randomized = base + (Math.random() * variance * 2 - variance);
  return Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, randomized));
}
```

**Resultado**:
- `curious`: 12-18s (base 15s)
- `calm`: 32-48s (base 40s)
- `chaotic`: 8-12s (base 10s)

---

## 🚀 Beneficios del Sistema

### 1. **Vida Propia**
Los cubos parecen tener metas propias sin esperar al usuario.

### 2. **Emergencia**
Interacciones complejas emergen de decisiones simples acumuladas.

### 3. **Personalidad Consistente**
El intervalo de pensamiento refuerza personalidad (chaotic rápido, calm lento).

### 4. **Memoria Evolutiva**
Cada tick autónomo puede agregar traits/facts/preferences → memoria crece orgánicamente.

### 5. **Best-Effort**
Si falla el AI backend, no interrumpe el flujo visual/físico del cubo.

---

## 🔮 Futuras Extensiones

### A. Síntesis de Memoria (episodios → core)
- Cada 10 interacciones, resumir aprendizajes en `coreBeliefs`
- Ver: `MemorySynthesis.service.ts` (pendiente)

### B. Metas Persistentes (goals con localStorage)
- Trackear metas de largo plazo que sobreviven sesiones
- Ver: `GoalManager.ts` (pendiente)

### C. Reflection Journal (diario del cubo)
- Generar entradas de diario cada 30 min
- UI: botón "Ver diario" en `CubeInteraction.tsx`

### D. Social Autonomous Thinking
- Cubos piensan sobre otros cubos sin trigger
- "Me pregunto qué está haciendo ${otherCube}..."

---

## 📝 Testing Manual

### Verificación del Sistema

1. **Iniciar proyecto**:
   ```pwsh
   npm run dev
   cd server && npm start
   ollama serve
   ```

2. **Observar consola**:
   ```
   🧠 [c1] Pensamiento autónomo ejecutado
   🧠 [c2] Pensamiento autónomo ejecutado
   ...
   ```

3. **Observar visuales**:
   - Thought bubbles cambian sin interacción
   - Colors shift según mood
   - Navegación hacia libros/zonas sin comando

4. **Verificar intervalos**:
   - `c1` (calm): ~40s entre pensamientos
   - `c3` (curious): ~15s entre pensamientos
   - `c4` (chaotic): ~10s entre pensamientos

5. **Verificar memoria**:
   - Abrir DevTools → Application → Local Storage
   - Buscar `cube_memory_${cubeId}`
   - Verificar que `traits`/`facts` crecen con el tiempo

---

## 🎯 Arquitectura Final: Bucle Completo

```
┌────────────────────────────────────────────────┐
│            CUBO (Entidad Física)               │
│                                                │
│  Estado:                                       │
│  - Posición, rotación, escala                  │
│  - Emoción (mood)                              │
│  - Conocimiento (domains)                      │
│  - Memoria (traits/facts/preferences)          │
│                                                │
│  Sensores:                                     │
│  - conversationMessage (usuario)               │
│  - bookTargets (mundo)                         │
│  - mirrorPosition (autoconocimiento)           │
└────────────────────────────────────────────────┘
                    ↓
         [Timer: 10-40s según personalidad]
                    ↓
┌────────────────────────────────────────────────┐
│          IA (Cerebro Externo)                  │
│                                                │
│  Recibe:                                       │
│  - Estado del cubo (posición, conocimiento)    │
│  - Memoria resumida (traits/facts recientes)   │
│  - Contexto RAG (worldKnowledge)               │
│                                                │
│  Piensa:                                       │
│  - ¿Qué he aprendido?                          │
│  - ¿Qué meta quiero perseguir?                 │
│  - ¿Cómo me siento?                            │
│  - ¿Qué puedo mejorar?                         │
│                                                │
│  Devuelve:                                     │
│  - BehaviorDecision (JSON)                     │
│    - goal/intent/target                        │
│    - transient effects (jump/color/light)      │
│    - learning (addTraits/addFacts)             │
│    - mood/personalityShift                     │
└────────────────────────────────────────────────┘
                    ↓
         [Community.updateCube()]
                    ↓
┌────────────────────────────────────────────────┐
│        CUBO (Ejecuta Decisiones)               │
│                                                │
│  Visual:                                       │
│  - Thought bubble (texto de reflexión)         │
│  - Color shift (según mood)                    │
│  - Eyebrows (expresión facial)                 │
│                                                │
│  Físico:                                       │
│  - Salto (transient.jump)                      │
│  - Navegación (target.position)                │
│  - Orientación (hacia objetivo)                │
│                                                │
│  Memoria:                                      │
│  - Actualiza traits/facts/preferences          │
│  - Guarda en localStorage                      │
│                                                │
│  Evolución:                                    │
│  - Acumula personalityShifts                   │
│  - Cambia personality tras N shifts            │
└────────────────────────────────────────────────┘
                    ↓
              [Bucle se repite]
```

---

## ✅ Checklist de Implementación

- [x] `AutonomousThinking.ts` creado
- [x] `BehaviorPlanner.planBehaviorAutonomous()` implementado
- [x] Timer en `Cube.tsx` useFrame
- [x] Intervalos por personalidad (10-40s)
- [x] Skip logic durante `thoughtMode === "conversation"`
- [x] Console logs para debugging
- [x] Documentación en copilot-instructions
- [x] Build exitoso (TypeScript + ESLint)
- [ ] Testing manual en dev server
- [ ] Verificación de memoria evolutiva

---

**Estado**: ✅ **Sistema completo implementado y compilado**

**Próximos pasos**: Testing manual + observar comportamiento emergente
