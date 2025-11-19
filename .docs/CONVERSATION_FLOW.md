# 🗣️ Flujo de Conversación Human → IA → Cubo

## 📋 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. HUMANO ESCRIBE                                                       │
│    └─> CubeInteraction.tsx                                             │
│        - Input field                                                    │
│        - onSendMessage(message)                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. APP PROCESA                                                          │
│    └─> App.tsx: handleUserMessage()                                    │
│        ├─ Rate limiting check (1s)                                      │
│        ├─ Cache check                                                   │
│        ├─ analyzeIntent(message)                                        │
│        ├─ extractConcepts(message)                                      │
│        └─ IF useAI:                                                     │
│           ├─> OpenAIService.generateResponse()                          │
│           │   ├─ Retry con backoff                                      │
│           │   ├─ Track tokens/costos                                    │
│           │   └─ return AI response                                     │
│           └─ ELSE:                                                      │
│               └─> InteractionSystem.generateResponse()                  │
│                   └─ return template response                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. RESPUESTA GENERADA                                                   │
│    └─> App.tsx                                                          │
│        ├─ setCubeResponse(response)                                     │
│        ├─ setConversationTimestamp(Date.now()) ← TRIGGER               │
│        └─ setIsThinking(false)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. PROPS A CANVAS                                                       │
│    └─> R3FCanvas.tsx                                                    │
│        ├─ conversationMessage={cubeResponse}                            │
│        └─ conversationTimestamp={timestamp}                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. SOLO AL CUBO SELECCIONADO                                            │
│    └─> R3FCanvas.tsx                                                    │
│        └─> <Cube                                                        │
│             conversationMessage={                                       │
│               selectedId === cube.id ? message : undefined              │
│             }                                                            │
│             conversationTimestamp={                                     │
│               selectedId === cube.id ? timestamp : undefined            │
│             }                                                            │
│           />                                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. CUBO RECIBE Y REACCIONA                                              │
│    └─> Cube.tsx                                                         │
│        ├─ useEffect detecta nuevo timestamp                             │
│        ├─ setThoughtMode("conversation")                                │
│        ├─ setThought(conversationMessage) ← MUESTRA EN BUBBLE          │
│        ├─ Calcula duración basada en:                                   │
│        │  ├─ Longitud del mensaje                                       │
│        │  └─ Personalidad (calm: 1.5x, chaotic: 0.6x)                  │
│        ├─ Reacciones visuales:                                          │
│        │  ├─ Small hop (squash phase)                                   │
│        │  ├─ Pulse strength boost                                       │
│        │  ├─ Face toward camera (if idle)                               │
│        │  └─ Emissive intensity increase                                │
│        └─ console.log para debugging                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. DURANTE CONVERSACIÓN                                                 │
│    └─> Cube.tsx: useFrame                                               │
│        ├─ Si thoughtMode === "conversation":                            │
│        │  ├─ Decrementa conversationThoughtTime                         │
│        │  ├─ Mantiene thought visible en bubble                         │
│        │  └─ Bloquea pensamientos autónomos                             │
│        └─ Animaciones activas:                                          │
│           ├─ Point light pulsing                                        │
│           ├─ Emissive breathing                                         │
│           ├─ Eyes tracking camera                                       │
│           └─ Eyebrows según mood                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. DESPUÉS DE DURACIÓN                                                  │
│    └─> Cube.tsx: useFrame                                               │
│        ├─ conversationThoughtTime <= 0                                  │
│        ├─ setThoughtMode("autonomous") ← VUELVE A NORMAL               │
│        └─ Genera follow-up thought por personalidad:                    │
│           ├─ calm: "Interesante...", "Hmm, déjame pensar..."           │
│           ├─ curious: "¡Quiero saber más!", "¿Y si...?"                │
│           ├─ extrovert: "¡Genial charla!", "¡Hablemos más!"            │
│           ├─ chaotic: "Bueno, siguiente cosa...", "Ya veo..."          │
│           └─ neutral: "Entendido.", "Anotado."                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ 9. VUELTA A AUTONOMÍA                                                   │
│    └─> Cube.tsx: useFrame                                               │
│        ├─ thoughtMode === "autonomous"                                  │
│        ├─ Genera pensamientos según contexto:                           │
│        │  ├─ Lectura de libros                                          │
│        │  ├─ Navegación a objetivos                                     │
│        │  ├─ Mirror recognition                                         │
│        │  └─ Idle thoughts                                              │
│        └─ Comportamiento normal restaurado                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Puntos Clave del Diseño

### ✅ Ventajas

1. **Unidireccional**: Humano → IA → Cubo (sin loops)
2. **Timestamp-based**: Detecta mensajes nuevos sin re-renders innecesarios
3. **Solo cubo seleccionado**: Props solo al cubo activo
4. **Duración inteligente**: Basada en longitud + personalidad
5. **No bloquea autonomía**: Vuelve a pensamientos autónomos después
6. **Visual feedback**: Hop, pulse, emissive, eyes

### 🔧 Detalles Técnicos

#### Cálculo de Duración
```tsx
const baseTime = 3000; // 3s base
const lengthFactor = Math.min(message.length * 30, 5000); // +30ms/char, max +5s
const personalityMultiplier = {
  calm: 1.5,     // 4.5-12s (ponder longer)
  curious: 1.2,  // 3.6-9.6s (thinks about it)
  extrovert: 0.8, // 2.4-6.4s (quick)
  chaotic: 0.6,  // 1.8-4.8s (barely lingers)
  neutral: 1.0   // 3-8s (standard)
};
duration = (baseTime + lengthFactor) * personalityMultiplier;
```

#### Reacciones Visuales
```tsx
// 1. Small hop
if (phase === "idle" || phase === "settle") {
  currentPhase = "squash";
  targetScale = [1.15, 0.85, 1.15]; // Gentle (not full jump)
}

// 2. Pulse boost
pulseStrength = Math.max(current, 0.6);

// 3. Face camera (if idle)
slerpToward(cameraYaw);

// 4. Emissive boost
emissiveIntensity += 0.2;
```

#### Follow-up Thoughts
```tsx
const followUpThoughts = {
  calm: ["Interesante...", "Hmm, déjame pensar...", "Entiendo..."],
  curious: ["¡Quiero saber más!", "¿Y si...?", "Hmm, interesante..."],
  extrovert: ["¡Genial charla!", "¡Me encantó!", "¡Hablemos más!"],
  chaotic: ["Bueno, siguiente...", "Ya veo...", "Listo, sigamos..."],
  neutral: ["Entendido.", "Anotado.", "Procesado."]
};
```

## 🚨 Casos Edge

### 1. Usuario envía mensaje mientras cubo está en conversación
- **Solución**: Timestamp actualiza → resetea timer → nueva duración

### 2. Cubo se deselecciona durante conversación
- **Solución**: Props se vuelven `undefined` → no afecta estado interno → sigue mostrando thought hasta que expire

### 3. Múltiples mensajes rápidos (spam)
- **Solución**: Rate limiting en App.tsx (1s mínimo)

### 4. Cubo está leyendo libro y llega mensaje
- **Solución**: conversationMode tiene prioridad → pausa lectura temporalmente → vuelve después

## 📊 Timeline Ejemplo

```
t=0s    Usuario: "Hola, ¿cómo estás?"
        ↓
t=0.2s  App procesa → OpenAI → respuesta: "¡Hola! Estoy bien, gracias."
        ↓
t=0.5s  Cubo recibe → thought="¡Hola! Estoy bien, gracias."
        ↓ (duration = 3s + 29*30ms + calm*1.5 = ~5.4s)
t=0.5s  Reacciones: hop + pulse + face camera
        ↓
t=0.5-5.9s  Muestra respuesta en bubble
        ↓
t=5.9s  Follow-up: "Interesante..."
        ↓
t=5.9s+ Vuelve a autonomía normal
```

## 🎨 UX Esperada

**Usuario ve:**
1. Escribe en chat panel (izquierda)
2. Cubo da un pequeño salto de reconocimiento
3. Thought bubble muestra la respuesta de IA
4. Cubo mira hacia la cámara
5. Light pulsa suavemente
6. Después de unos segundos, cubo genera follow-up thought
7. Vuelve a comportamiento normal

**Cubo experimenta:**
1. Recibe estímulo externo (conversación)
2. Prioriza respuesta sobre pensamientos autónomos
3. Reacciona visualmente
4. Mantiene atención durante duración apropiada
5. Procesa internamente
6. Vuelve a autonomía

## 🔄 Ciclo Completo

```
IDLE → CONVERSATION → FOLLOW-UP → IDLE
  ↑                                  ↓
  └──────────────────────────────────┘
         (loop continuo)
```

---

**Este diseño crea una sensación de que los cubos realmente "reciben" y "procesan" lo que les dices, sin romper su autonomía ni hacer el sistema demasiado complejo.**
