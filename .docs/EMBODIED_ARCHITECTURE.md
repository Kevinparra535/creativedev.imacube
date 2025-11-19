# 🏗️ Arquitectura de Embodied Multimodal Interaction

## 📐 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         👤 USUARIO (INPUT)                               │
│                                                                          │
│  ┌──────────────┐                                                       │
│  │ Keyboard     │ ──► "¡Eres increíble!"                                │
│  └──────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     🧠 PROCESAMIENTO COGNITIVO                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ InteractionSystem.ts                                              │  │
│  │ ┌────────────┐  ┌────────────┐  ┌────────────┐                  │  │
│  │ │ analyze    │→ │ extract    │→ │ generate   │                  │  │
│  │ │ Intent     │  │ Concepts   │  │ Response   │                  │  │
│  │ └────────────┘  └────────────┘  └────────────┘                  │  │
│  │                                                                   │  │
│  │ intent: "praise"                                                 │  │
│  │ concepts: { tone: "positive" }                                   │  │
│  │ response: "¡Gracias! ¡Eres increíble también!"                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ OpenAIService.ts (opcional)                                       │  │
│  │ ┌────────────┐  ┌────────────┐  ┌────────────┐                  │  │
│  │ │ Personality│→ │ GPT-4o     │→ │ Response   │                  │  │
│  │ │ Prompt     │  │ Mini       │  │ + Tokens   │                  │  │
│  │ └────────────┘  └────────────┘  └────────────┘                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    📦 ESTADO INTERNO (MEMORIA)                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Cube.tsx (State Management)                                       │  │
│  │                                                                   │  │
│  │ thought: "¡Gracias! ¡Eres increíble también!"                    │  │
│  │ thoughtMode: "conversation"                                      │  │
│  │ conversationThoughtTimeRef: 5000ms                               │  │
│  │                                                                   │  │
│  │ emotionsExperienced.add("happy")                                 │  │
│  │ currentPersonality: "extrovert"                                  │  │
│  │ socialTrait: "kind"                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ SocialLearningSystem.ts                                           │  │
│  │                                                                   │  │
│  │ processEmotions(thought) → ["happy"]                             │  │
│  │ checkPersonalityChange() → no change                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  🎨 VISUAL          │  │  🎯 MOTOR 3D        │  │  💾 PERSISTENCIA    │
│                     │  │                     │  │                     │
│ visualState.ts      │  │ NavigationSystem.ts │  │ Community.ts        │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │computeVisual    │ │  │ │ Face Camera     │ │  │ │ setCube()       │ │
│ │Targets()        │ │  │ │                 │ │  │ │                 │ │
│ │                 │ │  │ │ Orientation:    │ │  │ │ position        │ │
│ │color: #ffd166   │ │  │ │ → toward user   │ │  │ │ personality     │ │
│ │emissive: 0.12   │ │  │ │                 │ │  │ │ emotions        │ │
│ │breathAmp: 0.03  │ │  │ │ Physics:        │ │  │ │ knowledge       │ │
│ └─────────────────┘ │  │ │ → pulse light   │ │  │ │ reading         │ │
│                     │  │ └─────────────────┘ │  │ └─────────────────┘ │
│ BubbleEyes.tsx      │  │                     │  │                     │
│ ┌─────────────────┐ │  │ AttentionSystem.ts  │  │ cubeStorage.ts      │
│ │mood: "happy"    │ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │                 │ │  │ │ Scan Targets:   │ │  │ │ Auto-save       │ │
│ │browY: 0.52      │ │  │ │ → continue      │ │  │ │ Every 5s        │ │
│ │browRotZ: 0.2    │ │  │ │   exploration   │ │  │ │                 │ │
│ │(levantadas)     │ │  │ │                 │ │  │ │ Save on unload  │ │
│ │                 │ │  │ │ Anti-clumping:  │ │  │ │                 │ │
│ │eyeScale:        │ │  │ │ → separation    │ │  │ │ localStorage    │ │
│ │[1.2, 0.65]      │ │  │ │   forces        │ │  │ │ - static config │ │
│ │(abiertos)       │ │  │ └─────────────────┘ │  │ │ - dynamic state │ │
│ └─────────────────┘ │  │                     │  │ └─────────────────┘ │
│                     │  │                     │  │                     │
│ Cube.tsx (useFrame) │  │ Cube.tsx (useFrame) │  │ useCubePersistence  │
│ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │
│ │Material Update: │ │  │ │Quaternion slerp │ │  │ │ useEffect:      │ │
│ │                 │ │  │ │                 │ │  │ │ interval(5000)  │ │
│ │mat.color.set    │ │  │ │tmpQ.slerp(cam)  │ │  │ │ beforeunload    │ │
│ │mat.emissive     │ │  │ │                 │ │  │ │ unmount         │ │
│ │mat.roughness    │ │  │ │api.quaternion   │ │  │ └─────────────────┘ │
│ │                 │ │  │ │.set(...)        │ │  │                     │
│ │Scale lerp:      │ │  │ │                 │ │  │                     │
│ │scaleNow →       │ │  │ │Point Light:     │ │  │                     │
│ │targetScale      │ │  │ │intensity: 2.52  │ │  │                     │
│ │                 │ │  │ │(pulse: 1.2)     │ │  │                     │
│ │Breathing:       │ │  │ └─────────────────┘ │  │                     │
│ │sin(time) * 0.03 │ │  │                     │  │                     │
│ └─────────────────┘ │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       🖥️ RENDERIZADO (OUTPUT)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ R3F Canvas (Three.js)                                             │  │
│  │                                                                   │  │
│  │ ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │  │
│  │ │ Mesh       │  │ Eyes       │  │ Point      │  │ Thought    │  │  │
│  │ │            │  │            │  │ Light      │  │ Bubble     │  │  │
│  │ │ color:     │  │ browY:     │  │            │  │            │  │  │
│  │ │ #ffd166    │  │ 0.52       │  │ intensity: │  │ "¡Gracias! │  │  │
│  │ │            │  │            │  │ 2.52       │  │ ..."       │  │  │
│  │ │ emissive:  │  │ browRotZ:  │  │            │  │            │  │  │
│  │ │ 0.12       │  │ 0.2        │  │ color:     │  │ (Html)     │  │  │
│  │ │            │  │            │  │ #00d8ff    │  │            │  │  │
│  │ │ scale:     │  │ eyeScale:  │  │            │  │            │  │  │
│  │ │ [1.1,1.1]  │  │ [1.2,0.65] │  │            │  │            │  │  │
│  │ └────────────┘  └────────────┘  └────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Usuario VE:                                                             │
│  🟡 Cubo amarillo cálido (#ffd166)                                       │
│  ✨ Brillando suavemente (emissive: 0.12)                                │
│  👁️ Ojos abiertos/emocionados con cejas levantadas                       │
│  💡 Luz pulsando intensamente (2.52)                                     │
│  💬 Burbuja: "¡Gracias! ¡Eres increíble también!"                        │
│  📏 Ligeramente crecido (scale: 1.1 - excited)                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Ciclo Completo de Interacción

### Fase 1: INPUT (Texto del Usuario)
```
CubeInteraction.tsx
  └─ handleSend()
      └─ onSendMessage(message)
          └─ App.tsx: handleUserMessage()
```

### Fase 2: ANÁLISIS (Procesamiento Cognitivo)
```
InteractionSystem.ts
  ├─ analyzeIntent(message) → intent
  ├─ extractConcepts(message, intent) → concepts
  └─ generateResponse(message, intent, concepts, personality) → response

OpenAIService.ts (opcional)
  └─ generateResponse(cubeId, message, personality, ...) → AI response
```

### Fase 3: ACTUALIZACIÓN (Estado Interno)
```
App.tsx
  ├─ setCubeResponse(response)
  └─ setConversationTimestamp(Date.now())
      └─ Cube.tsx: useEffect([conversationMessage])
          ├─ setThought(conversationMessage)
          ├─ setThoughtMode("conversation")
          └─ conversationThoughtTimeRef = duration
```

### Fase 4: EXPRESIÓN (Multimodal Output)

#### A. VISUAL
```
Cube.tsx: useMemo([thought, personality])
  └─ computeVisualTargets(thought, personality, selected, hovered)
      └─ { color, emissiveIntensity, breathAmp, jitterAmp }
          └─ Cube.tsx: useFrame()
              ├─ materialRef.current.color.set(color)
              ├─ materialRef.current.emissiveIntensity = emissive
              └─ tmpScale = [1 + breathAmp, 1 + breathAmp, 1]
```

```
Cube.tsx: useMemo([thought, personality, phase])
  └─ mood calculation (3-tier priority)
      └─ { eyeTargetScale, eyeTargetLook, mood }
          └─ BubbleEyes/DotEyes
              ├─ browY = moodMap[mood].posY
              ├─ browRotZ = moodMap[mood].rotZ
              └─ eyeScale lerp
```

#### B. MOTOR
```
Cube.tsx: useFrame() [if selected && !navigating]
  └─ Face camera
      ├─ computeCameraQuaternion(state.camera)
      ├─ tmpQ.slerp(camQuat, delta * 4)
      └─ api.quaternion.set(...)
```

```
Cube.tsx: [if selected]
  └─ Point light pulse
      └─ intensity = 0.6 + 1.6 * pulseStrength
```

#### C. MEMORIA
```
Cube.tsx: useEffect([thought])
  └─ SocialLearningSystem.processEmotions(thought)
      └─ emotionsExperienced.add(...)
```

```
Cube.tsx: useFrame()
  └─ Community.setCube(id, { ... })
      └─ useCubePersistence: interval(5000)
          └─ cubeStorage.saveDynamicStates()
              └─ localStorage.setItem("creativedev.cubes.dynamicState", ...)
```

### Fase 5: RENDERIZADO (Three.js)
```
R3F Canvas
  ├─ <mesh ref={ref} scale={scaleNow}>
  │   └─ <meshStandardMaterial color={color} emissive={emissive} />
  ├─ <BubbleEyes mood={mood} eyeScale={eyeScale} />
  ├─ <pointLight intensity={pulsedIntensity} />
  └─ <Html><ThoughtBubble>{thought}</ThoughtBubble></Html>
```

---

## 🧩 Módulos y Responsabilidades

### 1. **Interfaz de Usuario (UI Components)**
```
CubeInteraction.tsx
  └─ Responsabilidad: Capturar input del usuario (texto)
  └─ Output: onSendMessage(message)

CubeList.tsx
  └─ Responsabilidad: Mostrar tabs de cubos
  └─ Output: onSelect(id)

CubeFooter.tsx
  └─ Responsabilidad: Knowledge graph (ReactFlow)
  └─ Input: selectedCube.knowledge, emotions, concepts

AIStatus.tsx
  └─ Responsabilidad: Estado de OpenAI, toggle AI/Template, reset
  └─ Output: onToggleAI(), onReset()
```

### 2. **Sistemas Cognitivos (Interaction)**
```
InteractionSystem.ts
  ├─ analyzeIntent(): text → MessageIntent
  ├─ extractConcepts(): text → ExtractedConcepts
  ├─ generateResponse(): intent + concepts → response text
  └─ generateVisualEffects(): intent + concepts → VisualEffect

OpenAIService.ts
  ├─ initializeOpenAI(): config → service instance
  ├─ generateResponse(): cubeId + message → AI response + tokens
  └─ Conversation history management (10 msgs/cube)
```

### 3. **Estado Interno (State Management)**
```
Cube.tsx (State)
  ├─ thought: string
  ├─ thoughtMode: "autonomous" | "conversation"
  ├─ currentPersonality: Personality
  ├─ emotionsExperienced: Set<string>
  ├─ traitsAcquired: Set<string>
  ├─ knowledge: Record<KnowledgeDomain, number>
  ├─ readingState: ReadingState
  ├─ conceptsLearned: Set<string>
  └─ capabilities: { navigation, selfRighting }

SocialLearningSystem.ts
  ├─ processEmotions(): thought → emotions[]
  ├─ checkPersonalityChange(): reading → new personality?
  └─ updateCapabilities(): observation → learning progress

BookReadingSystem.ts
  ├─ startReading(): book → readingState
  ├─ updateProgress(): delta → readingProgress += 0.05
  ├─ trackConcepts(): progress → conceptsLearned.add()
  └─ finishReading(): readingState → effects (knowledge, personality)
```

### 4. **Expresión Visual (Visual State)**
```
visualState.ts
  └─ computeVisualTargets(): thought + personality + UI → VisualTargets
      ├─ color (hex)
      ├─ emissiveIntensity
      ├─ roughness
      ├─ metalness
      ├─ breathAmp
      └─ jitterAmp

BubbleEyes.tsx / DotEyes.tsx
  └─ Eyebrow + Eye rendering with mood-based animation
      ├─ moodMap: mood → { browY, browRotZ, eyeScale }
      └─ useFrame: lerp smooth transitions
```

### 5. **Motor 3D (Physics & Navigation)**
```
NavigationSystem.ts
  ├─ computeJumpDirection(): cubePos + target + personality → direction
  ├─ computeOrientation(): target → quaternion
  └─ hasArrivedAtTarget(): distance + velocity → boolean

AttentionSystem.ts
  ├─ scanForTargets(): cubePos + personality → targets[]
  ├─ calculateInterest(): target + personality → interest score
  └─ checkBoredom(): visitHistory + personality → should rescan?

Cube.tsx (Physics)
  ├─ useBox(): mass, restitution, friction → physics body
  ├─ applyImpulse(): direction + strength → jump
  ├─ applyForce(): separation + wall avoidance → anti-clumping
  ├─ api.quaternion: slerp → self-righting + face camera
  └─ useFrame(): delta → scale/material/navigation updates
```

### 6. **Persistencia (Memory Storage)**
```
Community.ts
  ├─ setCube(): id + state → registry[id] = state
  ├─ getCube(): id → state
  ├─ listAll(): → state[]
  └─ subscribe(): callback → listener (RAF throttled)

cubeStorage.ts
  ├─ saveCubes(): cubes[] → localStorage["creativedev.cubes"]
  ├─ loadCubesFromStorage(): → cubes[] (merged)
  ├─ saveDynamicStates(): states[] → localStorage["...dynamicState"]
  ├─ loadDynamicStates(): → stateMap
  └─ mergeCubeStates(): cubes + states → merged[]

useCubePersistence.ts
  └─ useEffect:
      ├─ interval(5000): → saveDynamicStates()
      ├─ beforeunload: → saveDynamicStates()
      └─ unmount: → saveDynamicStates()
```

---

## 📊 Flujo de Datos: Lectura de Libro (Autónomo)

```
1. NavigationSystem.scanForTargets()
   └─ AttentionSystem: libro detectado (dist < 50m)
       └─ interest = personalityWeight / (1 + dist * 0.1)
           └─ currentTarget = book
               └─ shouldNavigate = true

2. Cube.useFrame(): Navigation logic
   └─ direction = computeJumpDirection(cubePos, book.position, personality)
       └─ api.applyImpulse([dx * strength, 3.2, dz * strength])
           └─ phase = "squash" → "air" → "land"

3. hasArrivedAtTarget(cubePos, book.position, velocity)
   └─ dist < 2.5 && velocity < 0.3
       └─ arrivedAtTarget = true
           └─ BookInteractionSystem: Math.random() < 0.3
               └─ startReading(book, personality)

4. readingState.isReading = true
   └─ Cube.useFrame(): Reading logic
       └─ readingTick += delta
           └─ if (readingTick > speed) {
               readingProgress += 0.05;
               trackConcepts(readingProgress, book.conceptos);
               thought = getCategoryThought(book.categoria, personality);
             }

5. readingProgress >= 1.0
   └─ finishReading(readingState)
       ├─ knowledge[domain] += effectValue
       ├─ newPersonality = checkPersonalityChange(...)
       ├─ traitsAcquired.add(...)
       ├─ booksRead.add(book.titulo)
       └─ pulseStrength = 1.0 (visual flash)

6. Community.setCube(id, { knowledge, readingExperiences, personality })
   └─ useCubePersistence: interval triggers
       └─ saveDynamicStates([...])
           └─ localStorage.setItem("creativedev.cubes.dynamicState", JSON.stringify(...))
```

---

## 🎯 Verificación de Modalidades

### Checklist de Integración

- [x] **TEXTO**: Input capturado → Análisis → Response generada
- [x] **VISUAL**: Response → Thought → Mood → Color/Emissive/Cejas/Ojos
- [x] **ESTADO INTERNO**: Emociones tracked → Personalidad puede cambiar → Rasgos adquiridos
- [x] **MEMORIA**: Conocimiento acumulado → Libros leídos → Conceptos aprendidos → Persistido en localStorage
- [x] **MOTOR 3D**: Navegación autónoma → Physics impulse → Auto-enderezamiento → Face camera

### Flujo Completo Validado

```
Usuario escribe "¡Eres increíble!"
  ↓
Intent: "praise", Concepts: { tone: "positive" }
  ↓
Response: "¡Gracias! ¡Eres increíble también!" (personality-specific)
  ↓
Thought updated → Mood: "happy" (detected "!")
  ↓
Visual: Color #ffd166, Emissive 0.12, Cejas levantadas, Ojos abiertos
  ↓
Motor: Face camera, Point light pulse 2.52, Scale 1.1
  ↓
Estado: emotionsExperienced.add("happy")
  ↓
Memoria: Auto-save en 5s → localStorage persistido
  ↓
Usuario VE cubo amarillo brillante con cejas felices y luz pulsante 🟡✨
```

---

## 🏆 Conclusión Arquitectónica

El sistema implementa **completamente** el patrón **Embodied Multimodal Interaction** mediante:

1. ✅ **Separación de responsabilidades** (UI → Cognition → State → Visual → Motor → Storage)
2. ✅ **Flujo unidireccional de datos** (Input → Processing → State → Output)
3. ✅ **Integración coherente** (Todas las modalidades trabajan juntas)
4. ✅ **Persistencia automática** (Memoria preservada entre sesiones)
5. ✅ **Expresión corporal completa** (No solo texto, sino visual + motor)

---

**📅 Fecha**: 19 de noviembre de 2025  
**✅ Estado**: Arquitectura verificada en código funcional
