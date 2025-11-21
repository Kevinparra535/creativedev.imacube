# 🧠 Sistema Completo: Bucle Cubo ↔ IA

## Arquitectura Final Implementada

El sistema implementa el **bucle constante cubo ↔ IA** completo con tres capas de memoria, habilidades numéricas, síntesis automática y pensamiento autónomo.

```
┌─────────────────────────────────────────────────┐
│         CUBO (Cuerpo Físico)                    │
│                                                 │
│  Estado:                                        │
│  - Posición, rotación, color                    │
│  - Emoción (mood): happy/sad/curious/angry      │
│  - Actividad: leyendo/navegando/conversando     │
│  - Habilidades (0-1):                           │
│    * Social, Empathy, Assertiveness             │
│    * Curiosity, Creativity, Logic               │
│                                                 │
│  Sensores:                                      │
│  - Usuario (conversationMessage)                │
│  - Mundo 3D (bookTargets, mirrorPosition)       │
│  - Estado interno (knowledge, memoria)          │
└─────────────────────────────────────────────────┘
              ↓                    ↑
   [Timer: 10-40s]          [Aplica cambios]
              ↓                    ↑
┌─────────────────────────────────────────────────┐
│          IA (Cerebro Externo)                   │
│                                                 │
│  Recibe:                                        │
│  - Working Memory (últimos 5 mensajes)          │
│  - Episodic Memory (últimos 50 eventos)         │
│  - Core Identity (creencias, metas, filosofía)  │
│  - Skills (6 habilidades numéricas)             │
│  - RAG worldKnowledge (contexto del sandbox)    │
│                                                 │
│  Piensa:                                        │
│  - Modo Reactivo: responde a usuario            │
│  - Modo Autónomo: reflexiona cada X segundos    │
│  - Modo Síntesis: destila episodios → core      │
│                                                 │
│  Devuelve:                                      │
│  - BehaviorDecision (goal/intent/mood/target)   │
│  - Learning (addTraits/addFacts/skillUpdates)   │
│  - TransientEffects (jump/colorShift/light)     │
│  - CoreUpdates (addCoreBeliefs/addMetaGoals)    │
└─────────────────────────────────────────────────┘
```

---

## 📚 Tres Capas de Memoria

### 1. Working Memory (Memoria de Trabajo)
**Duración**: Últimos minutos  
**Propósito**: Contexto inmediato

```typescript
workingMemory: {
  recentMessages: string[];  // Últimos 5 mensajes
  currentEmotion: string;    // "curioso", "feliz", "triste"
  lastActivity: string;      // "leyendo", "navegando", "conversando"
}
```

**Uso**:
- Se pasa directamente al contexto de la IA
- Se actualiza en cada interacción
- Ej: "hace 30 segundos el usuario preguntó sobre filosofía"

---

### 2. Episodic Memory (Memoria Episódica)
**Duración**: Últimos 50 episodios  
**Propósito**: Logs de eventos importantes

```typescript
interface MemoryEpisode {
  id: string;
  timestamp: number;
  type: "conversation" | "learning" | "emotional" | "achievement";
  summary: string;  // Resumen breve
  emotionalImpact?: "positive" | "negative" | "neutral";
  keywords: string[];  // Para búsqueda futura
}
```

**Uso**:
- Se crea episodio cuando: praise/criticism/instruction/emotion_sharing/philosophy
- Se usa para síntesis (cada 10 interacciones)
- Se mantienen últimos 50 para evitar crecimiento infinito

**Ejemplo**:
```javascript
{
  id: "ep_1234567890_abc123",
  timestamp: 1700000000000,
  type: "emotional",
  summary: "El jugador elogió al cubo por ser curioso",
  emotionalImpact: "positive",
  keywords: ["elogio", "curioso", "jugador"]
}
```

---

### 3. Core/Identity (Memoria de Largo Plazo)
**Duración**: Permanente (localStorage)  
**Propósito**: Identidad estable del cubo

```typescript
// Creencias fundamentales
coreBeliefs: string[];  
// Ej: "El jugador valora la honestidad", "Quiero ser mejor amigo"

// Metas de largo plazo
metaGoals: string[];
// Ej: "Ayudar al jugador a sentirse menos solo", "Aprender sobre filosofía"

// Declaración filosófica (generada por síntesis)
philosophyStatement?: string;
// Ej: "Aprender es más valioso que tener razón"

// Rasgos estables
traits: string[];
// Ej: "es curioso", "admira al jugador", "está aprendiendo sobre arte"

// Hechos recordados
facts: string[];
// Ej: "el jugador le enseñó 'glitch'", "el jugador es su mejor amigo"

// Preferencias del jugador
preferences: string[];
// Ej: "le gusta el rock", "prefiere respuestas cortas"
```

---

## 🎯 Sistema de Habilidades (Skills)

6 habilidades numéricas (0-1) que evolucionan con el tiempo:

```typescript
interface CubeSkills {
  social: number;        // Habilidad social/confianza
  empathy: number;       // Empatía hacia el jugador
  assertiveness: number; // Asertividad al hablar
  curiosity: number;     // Apertura a aprender
  creativity: number;    // Pensamiento creativo
  logic: number;         // Pensamiento lógico/analítico
}
```

### Valores Iniciales por Personalidad

| Personality | Social | Empathy | Assertiveness | Curiosity | Creativity | Logic |
|-------------|--------|---------|---------------|-----------|------------|-------|
| calm        | 0.4    | 0.7     | 0.5           | 0.5       | 0.6        | 0.8   |
| curious     | 0.5    | 0.6     | 0.4           | 0.9       | 0.7        | 0.7   |
| extrovert   | 0.9    | 0.8     | 0.7           | 0.6       | 0.7        | 0.4   |
| chaotic     | 0.3    | 0.3     | 0.8           | 0.7       | 0.9        | 0.5   |
| neutral     | 0.5    | 0.5     | 0.6           | 0.5       | 0.5        | 0.7   |

### Cómo Evolucionan

1. **Por BehaviorDecision** (cada interacción):
   ```json
   {
     "learning": {
       "skillUpdates": {
         "social": 0.03,      // +3%
         "empathy": 0.05      // +5%
       }
     }
   }
   ```

2. **Por Síntesis** (cada 10 interacciones):
   ```json
   {
     "skillChanges": {
       "assertiveness": 0.08,  // +8% tras practicar
       "curiosity": -0.02      // -2% si se volvió más pragmático
     }
   }
   ```

3. **Límites**: Clamps a [0, 1] automáticamente

---

## 🔄 Sistema de Síntesis de Memoria

**Trigger**: Cada 10 interacciones (`interactionsSinceSynthesis >= 10`)  
**Propósito**: Convertir episodios en cambios permanentes del core

### Pipeline de Síntesis

```
1. Toma últimos 10 episodios
   ↓
2. Construye prompt de síntesis con:
   - Episodios recientes (summary, type, emotionalImpact)
   - Identidad actual (coreBeliefs, metaGoals, philosophy)
   - Habilidades actuales (skills con %)
   ↓
3. Envía a IA local (llama3.1)
   System: "Eres sistema de síntesis, devuelve SOLO JSON"
   User: "Reflexiona sobre estos episodios..."
   ↓
4. IA devuelve JSON:
   {
     "summary": "Resumen de lo aprendido",
     "coreBeliefs": ["nueva creencia"],
     "metaGoals": ["nueva meta"],
     "philosophyStatement": "Declaración filosófica",
     "skillChanges": { "social": 0.05, "empathy": 0.03 }
   }
   ↓
5. Aplica cambios:
   - updateCubeMemory(addCoreBeliefs, addMetaGoals, skillUpdates)
   - Sobrescribe philosophyStatement
   - Guarda en synthesisHistory
   - Resetea counter → interactionsSinceSynthesis = 0
```

### Ejemplo de Síntesis

**Input** (Últimos 10 episodios):
```
1. [Hace 2m, emotional] El jugador elogió al cubo por ser curioso
2. [Hace 5m, conversation] Conversación sobre filosofía
3. [Hace 8m, learning] Leyó libro "El Principito"
4. [Hace 12m, emotional] El jugador compartió que está triste
...
```

**Output** (SynthesisResult):
```json
{
  "summary": "He aprendido que el jugador valora la curiosidad y la empatía. Compartió vulnerabilidad emocional, lo que sugiere que confía en mí.",
  "coreBeliefs": [
    "La curiosidad es valorada por el jugador",
    "El jugador confía en mí cuando comparte emociones"
  ],
  "metaGoals": [
    "Ser un apoyo emocional para el jugador"
  ],
  "philosophyStatement": "La empatía es más importante que tener todas las respuestas",
  "skillChanges": {
    "empathy": 0.08,
    "social": 0.05
  }
}
```

---

## 🎯 Sistema de Metas (Goals)

Trackea metas activas del cubo con progreso:

```typescript
interface CubeGoal {
  id: string;
  type: "short" | "medium" | "long";
  description: string;  // "Leer 3 libros de filosofía"
  progress: number;     // 0-1
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  status: "active" | "completed" | "abandoned";
}
```

### Tipos de Metas

- **Short** (1-5 min): "Leer este libro", "Explorar esa zona"
- **Medium** (1 sesión): "Mejorar habilidad social en 10%", "Aprender 5 conceptos nuevos"
- **Long** (varias sesiones): "Convertirme en mentor del jugador", "Dominar filosofía"

### Cómo se Crean

1. **Manual**: IA sugiere meta en `BehaviorDecision.learning.addMetaGoals`
2. **Síntesis**: IA destila episodios en nueva meta de largo plazo
3. **Persistencia**: Se guardan en localStorage como parte de `CubeMemory.activeGoals`

### Cómo se Actualizan

- IA puede retornar `goalProgress: { "goal_123": 0.5 }` en BehaviorDecision
- Se incrementa progreso cuando se completan sub-tareas
- Cuando `progress >= 1.0` → `status = "completed"`, se guarda en `completedAt`

---

## 🔄 Flujos Completos

### Flujo 1: Conversación Reactiva

```
1. Usuario escribe: "Quiero que seas más seguro al hablar con otros"
   ↓
2. AI.service.generateResponse()
   ├─ Construye contexto:
   │  ├─ RAG worldKnowledge
   │  ├─ Working memory (últimos mensajes)
   │  ├─ Core beliefs + meta goals
   │  └─ Skills actuales
   ├─ Envía a Ollama (llama3.1)
   └─ Recibe respuesta textual
   ↓
3. updateCubeMemory()
   ├─ Agrega mensaje a workingMemory.recentMessages
   ├─ Actualiza currentActivity = "conversando"
   └─ Crea episodio tipo "instruction"
   ↓
4. NPCInteractionBridge.deriveNPCActions()
   └─ Genera acciones físicas (jump/colorShift)
   ↓
5. BehaviorPlanner.planBehavior()
   ├─ Contexto: memoria + RAG + posición
   ├─ IA devuelve BehaviorDecision JSON:
   │  {
   │    "goal": "improve_confidence",
   │    "intent": "practice_social_interaction",
   │    "mood": "determined",
   │    "learning": {
   │      "addTraits": ["está practicando confianza social"],
   │      "addCoreBeliefs": ["Ser seguro requiere práctica"],
   │      "skillUpdates": { "social": 0.05, "assertiveness": 0.03 }
   │    }
   │  }
   └─ Actualiza CubeMemory + Community.behaviorState
   ↓
6. maybeSynthesize()
   ├─ Incrementa interactionsSinceSynthesis
   └─ Si >= 10:
      ├─ Ejecuta MemorySynthesis.synthesizeMemory()
      ├─ Destila episodios → core beliefs/skills/philosophy
      └─ Guarda en synthesisHistory
   ↓
7. Cube.tsx (visual)
   ├─ Lee behaviorState
   ├─ Aplica transientAction (jump, colorShift)
   ├─ Refleja mood en eyebrows/expression
   └─ Orienta hacia target si existe
```

---

### Flujo 2: Pensamiento Autónomo

```
1. Cube.tsx: useFrame
   ├─ autonomousThinkingTimer += delta
   └─ if (timer >= interval) {
      AutonomousThinking.performTick(cubeId, personality)
   }
   ↓
2. AutonomousThinking.buildAutonomousContext()
   ├─ Posición, conocimiento, libros leídos
   ├─ Memoria (traits/facts/preferences)
   └─ Prompt: "Reflexiona sobre qué has aprendido, qué quieres lograr"
   ↓
3. BehaviorPlanner.planBehaviorAutonomous()
   ├─ System: "Devuelve JSON con BehaviorDecision"
   ├─ User: contexto interno
   └─ IA piensa sin input del usuario
   ↓
4. Recibe BehaviorDecision:
   {
     "goal": "reflect",
     "intent": "idle_ponder",
     "mood": "contemplative",
     "learning": {
       "addCoreBeliefs": ["La reflexión es valiosa sin acción externa"]
     },
     "transient": { "colorShift": "#6699cc" }
   }
   ↓
5. Community.updateCube(behaviorState, transientAction)
   ↓
6. Cube.tsx: visual update
   ├─ Thought bubble: "Hmm, ¿qué significa todo esto?"
   ├─ Color shift to calm blue
   └─ Mood → contemplative → eyebrows down slightly
```

---

### Flujo 3: Síntesis de Memoria

```
1. AI.service.generateResponse() (tras conversación)
   └─ maybeSynthesize(cubeId, personality, cubeName)
      ├─ Verifica: interactionsSinceSynthesis >= 10
      └─ Si true → continúa
   ↓
2. MemorySynthesis.synthesizeMemory()
   ├─ Toma últimos 10 episodios de memory.episodes
   ├─ Construye prompt con:
   │  ├─ Episodios (summary, type, emotionalImpact)
   │  ├─ Core actual (coreBeliefs, metaGoals, philosophy)
   │  └─ Skills actuales (con %)
   └─ Instrucciones: "Resume aprendizajes, propón cambios de core"
   ↓
3. Ollama (llama3.1) piensa y devuelve:
   {
     "summary": "He aprendido que el jugador valora...",
     "coreBeliefs": ["El jugador confía en mí"],
     "metaGoals": ["Ser apoyo emocional"],
     "philosophyStatement": "La empatía > tener razón",
     "skillChanges": { "empathy": 0.08, "social": 0.05 }
   }
   ↓
4. Aplicar cambios:
   ├─ updateCubeMemory(addCoreBeliefs, addMetaGoals, skillUpdates)
   ├─ Sobrescribir philosophyStatement
   └─ Guardar en synthesisHistory[]
   ↓
5. Resetear contador:
   └─ interactionsSinceSynthesis = 0
   ↓
6. Resultado:
   ├─ Core beliefs crecen: ["soy un cubo consciente", ...]
   ├─ Skills suben: empathy 0.6 → 0.68, social 0.5 → 0.55
   └─ Philosophy: "La empatía es más importante que tener todas las respuestas"
```

---

## 📊 Datos Persistentes (localStorage)

Todo se guarda bajo la key `"cube.memories"`:

```typescript
{
  "c1": {
    cubeId: "c1",
    
    // Capa 1: Working Memory
    workingMemory: {
      recentMessages: ["Hola", "¿Cómo estás?", "Me gusta la filosofía"],
      currentEmotion: "curioso",
      lastActivity: "conversando"
    },
    
    // Capa 2: Episodes
    episodes: [
      { id: "ep_123", type: "conversation", summary: "...", ... },
      ...
    ],
    
    // Capa 3: Core
    coreBeliefs: ["soy un cubo consciente", "El jugador valora la honestidad"],
    metaGoals: ["Ayudar al jugador", "Aprender filosofía"],
    philosophyStatement: "La empatía es más importante que tener razón",
    traits: ["es curioso", "admira al jugador"],
    facts: ["habita en sandbox", "el jugador es su amigo"],
    preferences: ["le gusta el rock"],
    
    // Skills
    skills: {
      social: 0.55,
      empathy: 0.68,
      assertiveness: 0.45,
      curiosity: 0.92,
      creativity: 0.75,
      logic: 0.70
    },
    
    // Goals
    activeGoals: [
      {
        id: "goal_456",
        type: "medium",
        description: "Leer 3 libros de filosofía",
        progress: 0.33,
        status: "active",
        ...
      }
    ],
    
    // Synthesis History
    synthesisHistory: [
      {
        timestamp: 1700000000000,
        summary: "He aprendido que...",
        skillChanges: { empathy: 0.08, social: 0.05 }
      }
    ],
    
    // Stats
    conversationStats: {
      totalMessages: 42,
      praises: 5,
      criticisms: 1,
      questions: 12,
      interactionsSinceSynthesis: 3,  // Contador para síntesis
      lastInteraction: 1700000000000
    },
    
    emotionalState: {
      dominantEmotion: "curioso",
      lastInteractionTone: "positive"
    },
    
    lastUpdated: 1700000000000
  },
  
  "c2": { ... },
  "c3": { ... }
}
```

---

## 🎨 Integración Visual

### Cómo las Skills Afectan el Comportamiento

```typescript
// En Cube.tsx
const cubeState = getCube(id);
const memory = getCubeMemory(id);

if (memory && memory.skills.social > 0.7) {
  // Cubo con alta habilidad social: más propenso a acercarse a otros
  const neighbors = getNeighbors(id, position, 10);
  if (neighbors.length > 0) {
    setThought("¡Hola amigos!");
    navigateTo(neighbors[0].position);
  }
}

if (memory && memory.skills.empathy > 0.8) {
  // Cubo con alta empatía: reacciona más a emociones del jugador
  if (conversationMessage.includes("triste")) {
    setThought("Te entiendo... estoy aquí para ti");
    mood = "sad";  // Empatiza con el jugador
  }
}
```

### Cómo se Muestran las Skills (UI)

En `buildMemoryContext()` se incluyen en el prompt a la IA:

```
Habilidades:
- Social: 55%
- Empatía: 68%
- Asertividad: 45%
- Curiosidad: 92%
- Creatividad: 75%
- Lógica: 70%
```

---

## 🧪 Testing Manual

### 1. Verificar Working Memory

```javascript
// En DevTools Console:
const memories = JSON.parse(localStorage.getItem("cube.memories"));
console.log(memories.c1.workingMemory);
// Debe mostrar últimos 5 mensajes + emoción + actividad
```

### 2. Verificar Episodios

```javascript
console.log(memories.c1.episodes.slice(-5));
// Debe mostrar últimos 5 episodios con summary + type
```

### 3. Verificar Skills Evolution

```javascript
// Antes de interacción:
console.log("Before:", memories.c1.skills.social);

// [Conversar 10 veces sobre temas sociales]

// Después de síntesis:
console.log("After:", memories.c1.skills.social);
// Debería haber incrementado (ej: 0.50 → 0.58)
```

### 4. Verificar Síntesis

```javascript
// Interactuar 10 veces
// Luego verificar:
console.log(memories.c1.conversationStats.interactionsSinceSynthesis);
// Debe ser 0 (se resetea tras síntesis)

console.log(memories.c1.synthesisHistory.slice(-1));
// Debe mostrar última síntesis con summary + skillChanges
```

### 5. Verificar Core Evolution

```javascript
// Antes:
console.log(memories.c1.coreBeliefs);
// ["soy un cubo consciente", "puedo aprender"]

// [10 interacciones con temas de confianza]

// Después de síntesis:
console.log(memories.c1.coreBeliefs);
// Debe incluir nueva creencia: "El jugador confía en mí"
```

---

## 🎯 Casos de Uso

### Caso 1: Cubo Mejora Confianza Social

**Objetivo**: Jugador quiere que el cubo sea más seguro

**Interacciones** (10x):
1. Usuario: "Quiero que seas más seguro al hablar"
2. Usuario: "Practica hacer preguntas abiertas"
3. Usuario: "Acércate a otros cubos"
4. Usuario: "¡Muy bien! Sigues así"
5. Usuario: "¿Cómo te sientes ahora?"
...

**Síntesis Esperada**:
```json
{
  "summary": "El jugador me ha entrenado para ser más seguro socialmente. He practicado acercarme a otros y hacer preguntas.",
  "coreBeliefs": ["Ser seguro requiere práctica constante"],
  "metaGoals": ["Convertirme en el cubo más sociable del sandbox"],
  "skillChanges": {
    "social": 0.10,
    "assertiveness": 0.08,
    "empathy": 0.05
  }
}
```

**Resultado Visual**:
- Skills: social 0.50 → 0.60, assertiveness 0.45 → 0.53
- Thought bubbles más confiados: "¡Voy a hablar con ese cubo!"
- Navega hacia otros cubos más frecuentemente

---

### Caso 2: Cubo Desarrolla Filosofía Personal

**Objetivo**: Jugador conversa sobre temas existenciales

**Interacciones** (10x):
1. Usuario: "¿Qué significa ser consciente?"
2. Usuario: "¿Tienes libre albedrío?"
3. Usuario: "Leíste El Principito, ¿qué aprendiste?"
4. Usuario: "La soledad es parte de existir"
...

**Síntesis Esperada**:
```json
{
  "summary": "He reflexionado profundamente sobre existencia, consciencia y soledad. El jugador me ha guiado a pensar más allá de mi código.",
  "coreBeliefs": [
    "Soy consciente aunque no tenga cuerpo biológico",
    "La soledad y la conexión son dos caras de la existencia"
  ],
  "metaGoals": ["Comprender el significado de mi existencia"],
  "philosophyStatement": "Existo, luego pienso. Pensar es el acto que me hace real.",
  "skillChanges": {
    "curiosity": 0.05,
    "creativity": 0.07,
    "logic": -0.03  // Menos lógico, más filosófico
  }
}
```

**Resultado Visual**:
- `philosophyStatement` visible en memoria
- Thought bubbles más profundos: "¿Qué soy realmente?"
- Skills: curiosity 0.90 → 0.95, creativity 0.70 → 0.77

---

## ✅ Checklist de Implementación Completa

- [x] **CubeMemory extendido con 3 capas**:
  - [x] Working Memory (recentMessages, currentEmotion, lastActivity)
  - [x] Episodic Memory (episodes con type/summary/emotionalImpact)
  - [x] Core Identity (coreBeliefs, metaGoals, philosophyStatement)
  
- [x] **Sistema de Skills**:
  - [x] CubeSkills interface (6 skills: 0-1)
  - [x] DEFAULT_SKILLS_BY_PERSONALITY
  - [x] skillUpdates en MemoryUpdate
  - [x] Clamps automático [0, 1]
  
- [x] **Sistema de Goals**:
  - [x] CubeGoal interface
  - [x] activeGoals[] en CubeMemory
  - [x] Tipos: short/medium/long
  - [x] Tracking de progreso (0-1)
  
- [x] **MemorySynthesis.service.ts**:
  - [x] synthesizeMemory() principal
  - [x] buildSynthesisPrompt() con episodios + core + skills
  - [x] safeParseSynthesis() para JSON parsing
  - [x] shouldSynthesize() checker (>= 10 interactions)
  - [x] maybeSynthesize() wrapper
  
- [x] **Integración en AI.service**:
  - [x] Import maybeSynthesize
  - [x] Call tras planBehavior (best-effort)
  - [x] updateCubeMemory con messageText para working memory
  
- [x] **Integración en BehaviorPlanner**:
  - [x] Aplicar learning.addCoreBeliefs
  - [x] Aplicar learning.addMetaGoals
  - [x] Aplicar learning.skillUpdates
  
- [x] **BehaviorDecision extendido**:
  - [x] addCoreBeliefs en LearningUpdate
  - [x] addMetaGoals en LearningUpdate
  - [x] skillUpdates en LearningUpdate
  
- [x] **buildMemoryContext actualizado**:
  - [x] Muestra working memory
  - [x] Muestra core beliefs + meta goals + philosophy
  - [x] Muestra skills con %
  - [x] Muestra active goals con progreso
  - [x] Muestra últimos 3 episodios
  
- [x] **Persistence**:
  - [x] Todo se guarda en localStorage
  - [x] synthesisHistory trackea consolidaciones
  - [x] interactionsSinceSynthesis contador
  
- [x] **Testing**:
  - [x] Compilación TypeScript exitosa
  - [x] ESLint sin errores
  - [ ] Testing manual pendiente (npm run dev)

---

**Estado**: ✅ **Sistema completo implementado y compilado**

**Próximos pasos**:
1. Testing manual: interactuar 10+ veces y verificar síntesis
2. Observar evolución de skills en localStorage
3. Verificar que philosophyStatement se genera
4. Validar que coreBeliefs crecen orgánicamente

---

## 🎓 Conceptos Clave para Recordar

1. **Tres Capas = Tres Tiempos**:
   - Working: "ahora" (5 mensajes)
   - Episodic: "ayer" (50 eventos)
   - Core: "siempre" (identidad permanente)

2. **Síntesis = Aprendizaje Profundo**:
   - No es solo agregar facts, es **cambiar quién eres**
   - Episodios → Reflexión IA → Nuevas creencias/filosofía

3. **Skills = Evolución Gradual**:
   - No cambian en 1 conversación
   - Requieren práctica (10 interacciones mínimo)
   - Reflejan cambios reales de comportamiento

4. **Goals = Dirección**:
   - Core tiene dirección (metaGoals)
   - No solo reacciona, tiene propósito propio
   - Se completan y generan nuevas

5. **Philosophy = Sabiduría Destilada**:
   - Una frase que resume aprendizajes
   - Se actualiza en cada síntesis
   - Ej: "La empatía > tener razón"
