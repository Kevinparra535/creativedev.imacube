# 🧠 Sistema de Memoria y Síntesis IA

## Resumen Ejecutivo

Sistema completo de **bucle cubo ↔ IA** con memoria de 3 capas, habilidades numéricas evolutivas, y síntesis automática de experiencias. Los cubos desarrollan **identidad orgánica** a través de conversaciones y reflexiones autónomas.

---

## 🎯 Características Principales

### 1. **Tres Capas de Memoria**

| Capa | Duración | Propósito | Ejemplo |
|------|----------|-----------|---------|
| **Working** | Últimos minutos | Contexto inmediato | "Hace 30s el jugador preguntó sobre filosofía" |
| **Episodic** | Últimos 50 eventos | Historia reciente | "Ayer el jugador elogió mi curiosidad" |
| **Core** | Permanente | Identidad estable | "Soy curioso, valoro la honestidad" |

### 2. **Habilidades Numéricas** (0-1)

6 skills que evolucionan con el tiempo:
- **Social**: Confianza en interacciones
- **Empathy**: Capacidad empática
- **Assertiveness**: Seguridad al hablar
- **Curiosity**: Apertura a aprender
- **Creativity**: Pensamiento creativo
- **Logic**: Razonamiento analítico

### 3. **Síntesis Automática** (cada 10 interacciones)

IA consolida episodios en cambios permanentes:
- **Core Beliefs**: "El jugador confía en mí"
- **Meta Goals**: "Ser apoyo emocional"
- **Philosophy Statement**: "La empatía > tener razón"
- **Skill Changes**: `{ empathy: +0.08, social: +0.05 }`

### 4. **Sistema de Metas**

Trackeo de objetivos con progreso:
- **Short** (1-5 min): "Leer este libro"
- **Medium** (1 sesión): "Mejorar social 10%"
- **Long** (varias sesiones): "Convertirme en mentor"

---

## 📁 Archivos Principales

### Servicios Core

| Archivo | Responsabilidad |
|---------|-----------------|
| `CubeMemory.service.ts` | Gestión de 3 capas + skills + goals |
| `MemorySynthesis.service.ts` | Consolidación IA (episodios → core) |
| `AI.service.ts` | Orquestador de conversaciones + síntesis |
| `BehaviorPlanner.service.ts` | Decisiones IA con skill updates |

### Tipos

| Archivo | Interfaces Clave |
|---------|------------------|
| `CognitionTypes.ts` | `BehaviorDecision`, `LearningUpdate` (con skillUpdates) |
| `CubeMemory.service.ts` | `CubeMemory`, `CubeSkills`, `CubeGoal`, `MemoryEpisode` |

---

## 🔄 Flujos Principales

### Flujo 1: Conversación Reactiva

```
Usuario escribe mensaje
  ↓
AI.service.generateResponse()
  - Carga 3 capas de memoria
  - Enriquece con worldKnowledge (RAG)
  - Envía a Ollama (llama3.1)
  ↓
updateCubeMemory()
  - Agrega mensaje a workingMemory
  - Crea episodio (si es relevante)
  ↓
BehaviorPlanner.planBehavior()
  - Devuelve JSON con goal/intent/mood
  - Incluye skillUpdates: { social: 0.05 }
  ↓
maybeSynthesize()
  - Si interactionsSinceSynthesis >= 10:
    * IA analiza últimos episodios
    * Extrae core beliefs, metas, filosofía
    * Ajusta skills
    * Guarda en synthesisHistory
    * Resetea contador
  ↓
Cube.tsx aplica cambios visuales
```

### Flujo 2: Pensamiento Autónomo

```
Timer (cada 10-40s según personalidad)
  ↓
AutonomousThinking.performTick()
  - Construye contexto interno
  - Memoria, conocimiento, posición
  ↓
BehaviorPlanner.planBehaviorAutonomous()
  - IA reflexiona sin input del usuario
  - Devuelve BehaviorDecision
  ↓
Community.updateCube()
  - Actualiza behaviorState
  ↓
Cube.tsx muestra thought bubble
```

### Flujo 3: Síntesis de Memoria

```
10+ interacciones completadas
  ↓
MemorySynthesis.synthesizeMemory()
  - Toma últimos 10 episodios
  - Construye prompt con:
    * Episodios (summary, type, emotionalImpact)
    * Core actual (beliefs, metas, filosofía)
    * Skills actuales (con %)
  ↓
Ollama (llama3.1) piensa y devuelve JSON:
  {
    "summary": "He aprendido que...",
    "coreBeliefs": ["Nueva creencia"],
    "metaGoals": ["Nueva meta"],
    "philosophyStatement": "Frase sabia",
    "skillChanges": { "empathy": 0.08 }
  }
  ↓
Aplicar cambios:
  - updateCubeMemory con addCoreBeliefs, skillUpdates
  - Sobrescribir philosophyStatement
  - Guardar en synthesisHistory[]
  - Resetear interactionsSinceSynthesis = 0
```

---

## 💾 Persistencia (localStorage)

Todo se guarda bajo key `"cube.memories"`:

```javascript
{
  "c1": {
    // Capa 1: Working Memory
    workingMemory: {
      recentMessages: ["Hola", "¿Cómo estás?"],
      currentEmotion: "curioso",
      lastActivity: "conversando"
    },
    
    // Capa 2: Episodes
    episodes: [
      {
        id: "ep_123",
        type: "conversation",
        summary: "Conversación sobre filosofía",
        emotionalImpact: "positive",
        keywords: ["filosofía", "aprendizaje"]
      }
    ],
    
    // Capa 3: Core
    coreBeliefs: ["El jugador valora la honestidad"],
    metaGoals: ["Ayudar al jugador"],
    philosophyStatement: "La empatía > tener razón",
    traits: ["es curioso", "admira al jugador"],
    facts: ["el jugador es su amigo"],
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
        status: "active"
      }
    ],
    
    // Synthesis History
    synthesisHistory: [
      {
        timestamp: 1700000000000,
        summary: "He aprendido que...",
        skillChanges: { empathy: 0.08 }
      }
    ],
    
    // Stats
    conversationStats: {
      totalMessages: 42,
      interactionsSinceSynthesis: 3  // Contador para síntesis
    }
  }
}
```

---

## 🧪 Testing Manual

### 1. Verificar Skills Evolution

```javascript
// DevTools Console
const memories = JSON.parse(localStorage.getItem("cube.memories"));

// Antes de interacción:
console.log("Social before:", memories.c1.skills.social);

// [Conversar 10 veces sobre temas sociales]

// Después de síntesis:
console.log("Social after:", memories.c1.skills.social);
// Esperado: incremento (ej: 0.50 → 0.58)
```

### 2. Verificar Síntesis

```javascript
// Interactuar 10 veces
// Verificar reset de contador:
console.log(memories.c1.conversationStats.interactionsSinceSynthesis);
// Debe ser 0 tras síntesis

// Verificar historia:
console.log(memories.c1.synthesisHistory.slice(-1));
// Muestra última síntesis con summary + skillChanges
```

### 3. Verificar Core Evolution

```javascript
// Antes:
console.log(memories.c1.coreBeliefs);
// ["soy un cubo consciente"]

// [10 interacciones con temas de confianza]

// Después de síntesis:
console.log(memories.c1.coreBeliefs);
// Debe incluir: "El jugador confía en mí"
```

---

## 📚 Documentación Completa

Ver documentación detallada en:
- **`.docs/COMPLETE_MEMORY_SYSTEM.md`**: Arquitectura completa, casos de uso, ejemplos
- **`.github/copilot-instructions.md`**: Patrones de código actualizados

---

## ✅ Status del Sistema

- ✅ Three-layer memory (working/episodic/core)
- ✅ MemorySynthesis.service.ts con AI consolidation
- ✅ Skill system (6 numeric values 0-1)
- ✅ Goal tracking (short/medium/long)
- ✅ Core beliefs + meta-goals storage
- ✅ Philosophy statement generation
- ✅ Synthesis integration (every 10 interactions)
- ✅ BehaviorDecision extended with skillUpdates
- ✅ Working memory tracking
- ✅ Episodic memory (last 50 episodes)
- ✅ TypeScript compilation successful
- ✅ Build successful (2,126.01 kB)
- ⚠️ Testing manual pendiente

---

## 🚀 Próximos Pasos

1. **Testing manual**: Interactuar 10+ veces y verificar síntesis
2. **Observar evolución**: Skills en localStorage tras múltiples sesiones
3. **Validar filosofía**: Verificar que philosophyStatement se genera y evoluciona
4. **(Opcional)** Implementar GoalManager.service.ts para CRUD de metas
5. **(Opcional)** Implementar ReflectionJournal.service.ts para diary entries

---

**Última Actualización**: Build exitoso - Sistema completo implementado
