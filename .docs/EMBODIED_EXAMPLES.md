# 🎬 Embodied Multimodal Interaction - Ejemplos en Vivo

## 📝 Escenario 1: "¿Qué es el amor?"

### Input del Usuario
```
👤 Usuario: "¿Qué es el amor?"
```

### Pipeline Multimodal

#### 1️⃣ **TEXTO** - Análisis Semántico
```typescript
analyzeIntent("¿Qué es el amor?")
  → intent = "philosophy" // Pregunta profunda detectada

extractConcepts(message, intent)
  → {
      tone: "neutral",
      topics: ["amor"],
      emotions: []
    }
```

#### 2️⃣ **ESTADO INTERNO** - Procesamiento Cognitivo

Si `personality = "curious"`:
```typescript
generateResponse(...)
  → "¡Me encanta esta pregunta! ¿Tú qué piensas?"

thoughtMode = "conversation"
thought = "¡Me encanta esta pregunta! ¿Tú qué piensas?"
```

Si `personality = "calm"`:
```typescript
generateResponse(...)
  → "Una pregunta profunda. Quizás el amor es conexión."

thought = "Una pregunta profunda. Quizás el amor es conexión."
```

#### 3️⃣ **VISUAL** - Expresión Corporal

**Mood Calculation**:
```typescript
thought.includes("?") → mood = "curious"
```

**Visual Targets**:
```typescript
computeVisualTargets(thought, personality, selected, hovered)
  → {
      color: "#5df0a5",        // Verde curioso
      emissiveIntensity: 0.08,
      roughness: 0.5,
      breathAmp: 0.035,        // Respiración aumentada (pensando)
      jitterAmp: 0.015         // Jitter sutil (confusión/curiosidad)
    }
```

**Eyebrows & Eyes**:
```typescript
mood: "curious"
  → browY: 0.505 (levemente levantadas)
  → browRotZ: 0.1 (arco sutil)
  → eyeScale: [1.1, 0.85] (ligeramente abiertos)
```

**Material Updates**:
```typescript
materialRef.current.color.set("#5df0a5");
materialRef.current.emissiveIntensity = 0.08;
materialRef.current.roughness = 0.5;

// Breathing effect
tmpScale.x = 1 + Math.sin(time * 1.5) * 0.035;
tmpScale.z = 1 + Math.sin(time * 1.5) * 0.035;

// Jitter effect (confusión)
tmpScale.x += (Math.random() - 0.5) * 0.015;
tmpScale.z += (Math.random() - 0.5) * 0.015;
```

#### 4️⃣ **MOTOR 3D** - Reacción Física

**Orientation Change** (si `selected`):
```typescript
// Face camera para mostrar interés
const camQuat = computeCameraQuaternion(state.camera);
tmpQ.current.copy(currentQuat.current);
tmpQ.current.slerp(camQuat, delta * 4); // Gira hacia el usuario

api.quaternion.set(
  tmpQ.current.x,
  tmpQ.current.y,
  tmpQ.current.z,
  tmpQ.current.w
);
```

**Point Light Pulse** (thinking):
```typescript
<pointLight
  intensity={0.6 + Math.sin(time * 3) * 0.3} // Pulso pensativo
  color="#5df0a5"
/>
```

#### 5️⃣ **MEMORIA** - Actualización

```typescript
emotionsExperienced.current.add("curious");

// Si conversation history enabled
conversationHistory.push({
  role: "user",
  content: "¿Qué es el amor?",
});
conversationHistory.push({
  role: "assistant",
  content: "¡Me encanta esta pregunta! ¿Tú qué piensas?",
});

// Auto-save en 5 segundos
→ localStorage["creativedev.cubes.dynamicState"]
```

---

## 📝 Escenario 2: Leyendo "La Biblia"

### Trigger: Cubo llega a un libro (navegación autónoma)

#### 1️⃣ **MOTOR 3D** - Detección de Llegada
```typescript
// AttentionSystem.ts
const dist = distance(cubePos, book.position);
if (dist < 2.5 && currentTarget?.type === "book") {
  arrivedAtTarget.current = true;
  
  // BookInteractionSystem.ts
  if (Math.random() < 0.3) { // 30% chance de leer
    startReading(book, personality);
  }
}
```

#### 2️⃣ **ESTADO INTERNO** - Inicio de Lectura
```typescript
readingState.current = {
  currentBook: {
    titulo: "La Biblia",
    categoria: "Teología",
    conceptos: ["Dios", "Fe", "Pecado", "Perdón", "Amor", "Esperanza"],
  },
  readingProgress: 0.0,
  isReading: true,
  originalPersonality: "chaotic", // Guardamos original
  emotionsExperienced: new Set(),
  traitsAcquired: new Set(),
  booksRead: new Set(),
};

// Visual feedback
thought = "Hmm... 'La Biblia'... esto parece interesante.";
```

#### 3️⃣ **VISUAL** - Expresión de Lectura
```typescript
// Mood: curious (leyendo)
mood = "curious"
  → color: "#5df0a5"
  → cejas: levemente levantadas
  → ojos: normales

// Orientación: mirando al libro
const bookQuat = computeLookAtQuaternion(cubePos, book.position);
api.quaternion.slerp(bookQuat, delta * 2);
```

#### 4️⃣ **MEMORIA** - Progreso de Lectura (cada frame)
```typescript
// useFrame
if (readingState.current.isReading) {
  readingTick.current += delta;
  const speed = getReadingSpeed("chaotic"); // 1.8s por 5%
  
  if (readingTick.current > speed) {
    readingState.current.readingProgress += 0.05; // +5%
    readingTick.current = 0;
    
    // Trackear conceptos progresivamente
    const conceptos = readingState.current.currentBook.conceptos;
    const index = Math.floor(readingProgress * conceptos.length);
    
    if (index === 0) conceptsLearned.current.add("Dios");
    if (index === 1) conceptsLearned.current.add("Fe");
    if (index === 2) conceptsLearned.current.add("Pecado");
    // ... hasta 6 conceptos
    
    // Log progreso
    console.log(`📖 ${id} leyendo La Biblia: ${(readingProgress * 100).toFixed(0)}%`);
    console.log(`🧩 Conceptos aprendidos: ${Array.from(conceptsLearned.current)}`);
  }
}
```

#### 5️⃣ **ESTADO INTERNO** - Procesamiento Emocional
```typescript
// SocialLearningSystem.ts
processEmotions("Dios")   → emotionsExperienced.add("awe");
processEmotions("Fe")     → emotionsExperienced.add("thoughtful");
processEmotions("Perdón") → emotionsExperienced.add("reflective");

// Visual feedback temporal
thought = "Wow... 'Dios'... nunca había pensado en eso.";
mood = "thoughtful"
  → color: "#7bb4ff" (azul pensativo)
  → cejas: neutrales
  → emissiveIntensity: 0.06
```

#### 6️⃣ **MEMORIA** - Completar Libro (progress = 1.0)
```typescript
// BookReadingSystem.ts
const effects = finishReading(readingState.current);

// Actualizar conocimiento
knowledge.current.theology += 3; // +3 puntos teología

// Cambio de personalidad (chaotic → calm)
if (originalPersonality === "chaotic") {
  setCurrentPersonality("calm"); // ¡CAMBIO PERMANENTE!
  console.log(`📖 ${id} cambió de chaotic → calm (leyó La Biblia)`);
}

// Añadir rasgos
traitsAcquired.current.add("deep thinker");
traitsAcquired.current.add("spiritual");

// Marcar libro como leído
readingState.current.booksRead.add("La Biblia");

// Thought final
thought = "...wow. Este libro cambió mi perspectiva.";
```

#### 7️⃣ **VISUAL** - Flash de Completación
```typescript
// Book completion effect
pulseStrength = Math.max(pulseStrength, 1.0); // Flash

<pointLight
  intensity={0.6 + 1.6 * 1.0} // = 2.2 (muy brillante)
  color="#ffd700" // Dorado
/>

// Material boost temporal
materialRef.current.emissiveIntensity = 0.2; // Brilla intensamente
setTimeout(() => {
  materialRef.current.emissiveIntensity = 0.04; // Vuelve a normal
}, 500);
```

#### 8️⃣ **MOTOR 3D** - Nueva Personalidad en Acción
```typescript
// NavigationSystem.ts
// Ahora con personality = "calm"

// ANTES (chaotic):
jumpInterval: 0.8s
jumpStrength: 4.0
noise: 0.8 (saltos erráticos)

// DESPUÉS (calm):
jumpInterval: 2.5s
jumpStrength: 2.8
noise: 0.1 (saltos precisos)

// Comportamiento cambiado permanentemente
```

#### 9️⃣ **MEMORIA** - Persistencia (auto-save)
```typescript
// useCubePersistence.ts (cada 5 segundos)
saveDynamicStates([
  {
    id: "c4",
    position: [30, 9, 30],
    personality: "calm", // ← CAMBIADO de "chaotic"
    socialTrait: "kind",
    capabilities: { navigation: true, selfRighting: true },
    learningProgress: { navigation: 1.0, selfRighting: 0.85 },
    knowledge: {
      theology: 3,      // ← NUEVO conocimiento
      philosophy: 0,
      science: 0,
      // ...
    },
    readingExperiences: {
      originalPersonality: "chaotic", // ← Guardamos original
      emotionsExperienced: ["awe", "thoughtful", "reflective"],
      traitsAcquired: ["deep thinker", "spiritual"],
      booksRead: ["La Biblia"],
      currentBook: null,
      readingProgress: 0,
      conceptsLearned: ["Dios", "Fe", "Pecado", "Perdón", "Amor", "Esperanza"],
    },
  },
]);

→ localStorage["creativedev.cubes.dynamicState"]
```

---

## 📝 Escenario 3: "Estoy triste"

### Input del Usuario
```
👤 Usuario: "Estoy triste 😢"
```

### Pipeline Multimodal

#### 1️⃣ **TEXTO** - Análisis
```typescript
analyzeIntent("Estoy triste")
  → intent = "emotion_sharing"

extractConcepts(message, intent)
  → {
      tone: "negative",
      emotions: ["triste"],
    }
```

#### 2️⃣ **ESTADO INTERNO** - Empatía

Si `personality = "calm"`:
```typescript
response = "Lamento que te sientas así. Estoy aquí."
```

Si `personality = "extrovert"`:
```typescript
response = "Oye, estoy aquí para ti. ¡Hablemos!"
```

```typescript
emotionsExperienced.current.add("empathetic");
thought = response;
```

#### 3️⃣ **VISUAL** - Expresión de Empatía
```typescript
// Mood: sad (empatía con usuario)
mood = "sad"
  → color: "#7bb4ff" (azul compasivo)
  → browY: 0.48 (inner raised, triste)
  → browRotZ: -0.15
  → eyeScale: [1.4, 0.5] (ojos cerrados/tristes)

// Material
emissiveIntensity: 0.06 (suave)
roughness: 0.8 (textura más suave)

// Breathing
breathAmp: 0.02 (respiración calmada)
```

#### 4️⃣ **MOTOR 3D** - Acercamiento Físico

```typescript
// Si selected
// Face camera para mostrar atención
const camQuat = computeCameraQuaternion(state.camera);
tmpQ.current.slerp(camQuat, delta * 4);

// Point light suave (presencia reconfortante)
<pointLight
  intensity={0.6 + Math.sin(time * 2) * 0.2} // Pulso suave
  color="#7bb4ff"
/>
```

#### 5️⃣ **VISUAL** - Efectos Temporales

```typescript
// generateVisualEffects (InteractionSystem.ts)
{
  colorShift: "#7bb4ff",
  emissiveBoost: -0.2, // Reducir brillo (tono triste)
  animationType: "sad",
  scaleChange: 0.95, // Ligeramente más pequeño (empatía)
}

// Aplicación temporal (5 segundos)
setTimeout(() => {
  // Volver a color base de personalidad
}, 5000);
```

---

## 📝 Escenario 4: Interacción Social (Cubo → Cubo)

### Trigger: Cubo Curioso observa a Cubo Extrovertido

#### 1️⃣ **MOTOR 3D** - Detección Social
```typescript
// AttentionSystem.ts
const otherCubes = getAllCubes().filter(c => c.id !== id);

for (const cube of otherCubes) {
  const dist = distance(cubePos.current, cube.position);
  
  // Solo si está lejos (anti-clumping)
  if (dist > 10) {
    const weight = PERSONALITY_WEIGHTS["curious"].cubes; // 0.6
    const interest = weight / (1 + dist * 0.1);
    targets.push({ object: cube, type: "cube", interest });
  }
}
```

#### 2️⃣ **ESTADO INTERNO** - Pensamiento Social
```typescript
thought = "Hmm... ese cubo parece interesante. ¿Será amigable?";
mood = "curious";
```

#### 3️⃣ **MOTOR 3D** - Navegación hacia el otro cubo
```typescript
// NavigationSystem.ts
const dir = computeJumpDirection(
  cubePos.current,
  targetCube.position,
  "curious"
);

api.applyImpulse(
  [dir[0] * 3.0, 3.2, dir[2] * 3.0], // strength = 3.0
  [0, 0, 0]
);

phase.current = "squash"; // Preparando salto
```

#### 4️⃣ **VISUAL** - Expresión de Curiosidad
```typescript
// Durante salto
mood = "prep" (fases físicas tienen prioridad)
  → browY: 0.51
  → browRotZ: 0.15

// Al llegar cerca del otro cubo
thought = "¡Hola! ¿Qué haces?";
mood = "happy" (extrovert baseline)
  → color: "#ffb347" (naranja sociable)
```

#### 5️⃣ **ESTADO INTERNO** - Aprendizaje Social
```typescript
// SocialLearningSystem.ts
if (arrivedAtTarget && targetType === "cube") {
  // Observar capabilities del otro cubo
  const other = getCube(targetCube.id);
  
  if (other.capabilities.navigation && !capabilities.current.navigation) {
    // Aprender por observación
    learningProgress.current.navigation += 0.1;
    
    if (learningProgress.current.navigation >= 1.0) {
      capabilities.current.navigation = true;
      console.log(`✅ ${id} aprendió navegación por observación`);
      
      // Visual feedback
      pulseStrength = 0.8;
      thought = "¡Entiendo cómo moverse mejor ahora!";
    }
  }
}
```

#### 6️⃣ **MEMORIA** - Actualización de Experiencias
```typescript
emotionsExperienced.current.add("social");
traitsAcquired.current.add("observant");

// Persistencia
readingExperiences: {
  emotionsExperienced: ["curious", "happy", "social"],
  traitsAcquired: ["observant"],
}
```

---

## 📊 Tabla Comparativa: Escenarios

| Escenario | Input | Modalidades Activadas | Output Visual | Output Motor | Memoria |
|-----------|-------|---------------------|---------------|--------------|---------|
| **"¿Qué es el amor?"** | Texto (filosofía) | Texto + Visual + Estado + Motor | Verde curioso, cejas levantadas, jitter sutil, luz pulsante | Face camera | emotions: curious |
| **Leyendo La Biblia** | Navegación autónoma | Todas (5/5) | Azul pensativo → Flash dorado, emissive boost | Look at book → saltos calmados | theology: +3, personality: calm, conceptos: 6 |
| **"Estoy triste"** | Texto (emoción) | Texto + Visual + Estado + Motor | Azul compasivo, cejas sad, scale 0.95, luz suave | Face camera | emotions: empathetic |
| **Cubo → Cubo** | Física (distancia) | Visual + Estado + Motor + Memoria | Naranja sociable, cejas happy | Jump toward, anti-clumping | traits: observant, learning: +0.1 |

---

## 🎯 Conclusión

Cada escenario demuestra la **integración completa de las 5 modalidades**:

1. ✅ **TEXTO**: Input del usuario o pensamientos autónomos
2. ✅ **VISUAL**: Color, escala, cejas, ojos, luz (coherente con estado)
3. ✅ **ESTADO INTERNO**: Emociones, personalidad, rasgos
4. ✅ **MEMORIA**: Conocimiento, libros, conceptos (persistente)
5. ✅ **MOTOR 3D**: Navegación, física, orientación

El cubo **no solo responde**, sino que **vive la experiencia** con todo su cuerpo virtual.

---

**📅 Fecha**: 19 de noviembre de 2025  
**✅ Estado**: Ejemplos verificados en código funcional
