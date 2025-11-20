# Sistema de Memoria Dinámica para Cubos

Implementación del concepto de "entrenamiento vía interacción" donde cada cubo evoluciona su personalidad y memoria según las conversaciones con el jugador.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUJO DE CONVERSACIÓN                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Jugador envía mensaje → "Sé más sarcástico"            │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  2. InteractionSystem analiza:                              │
│     • Intent: "instruction"                                 │
│     • Concepts: personalityHints = ["sarcastic"]            │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  3. CubeMemory extrae y actualiza:                          │
│     • traits += "está siendo más sarcástico"               │
│     • facts += "el jugador le pidió que sea más sarcástico" │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  4. AI.service construye contexto:                          │
│     [MEMORIA DEL CUBO]                                      │
│     Rasgos de personalidad:                                 │
│     - es curioso                                             │
│     - está siendo más sarcástico    ← Nuevo                │
│                                                              │
│     Hechos importantes:                                      │
│     - el jugador le pidió que sea más sarcástico   ← Nuevo │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Ollama recibe prompt con memoria + mensaje               │
│     → Genera respuesta acorde a memoria actualizada         │
└─────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. CubeMemory.service.ts

Servicio principal de memoria persistente en `localStorage`.

#### Estructura de Memoria

```typescript
interface CubeMemory {
  cubeId: string;
  
  // Rasgos de personalidad dinámicos
  traits: string[];
  // Ejemplos: "es curioso", "admira al jugador", "está siendo más sarcástico"
  
  // Hechos aprendidos del mundo/jugador
  facts: string[];
  // Ejemplos: "el jugador le enseñó 'glitch'", "el jugador dijo que son amigos"
  
  // Preferencias del jugador detectadas
  preferences: string[];
  // Ejemplos: "le gusta el rock", "prefiere respuestas cortas"
  
  // Estado emocional acumulado
  emotionalState: {
    dominantEmotion?: string;
    lastInteractionTone?: "positive" | "negative" | "neutral";
  };
  
  // Estadísticas de interacción
  conversationStats: {
    totalMessages: number;
    praises: number;
    criticisms: number;
    questions: number;
    lastInteraction: number;
  };
}
```

#### Funciones Clave

**Inicialización**:
```typescript
initializeCubeMemory(cubeId, personality, cubeName)
```
- Crea memoria nueva con rasgos base según personalidad
- Persiste en localStorage
- Se llama una vez al crear el cubo

**Actualización**:
```typescript
updateCubeMemory(cubeId, {
  addTraits: ["está siendo más amable"],
  addFacts: ["el jugador le pidió que sea más amable"],
  emotionalTone: "positive",
  intent: "instruction"
})
```
- Agrega nuevos rasgos/hechos sin duplicados
- Actualiza estado emocional y estadísticas
- Limita arrays para evitar memoria infinita (últimos 20 hechos, 10 preferencias)

**Extracción Automática**:
```typescript
extractMemoryFromMessage(message, intent)
```
- Analiza el mensaje del jugador con regex patterns
- Detecta:
  - Preferencias: "me gusta X", "prefiero Y"
  - Instrucciones: "sé más Z", "actúa como W"
  - Emociones compartidas: "estoy triste/feliz"
  - Enseñanzas: "conoces X?", "Y significa..."
- Retorna objeto `MemoryUpdate` listo para aplicar

**Construcción de Contexto**:
```typescript
buildMemoryContext(memory)
```
- Genera string markdown con memoria del cubo
- Formato:
  ```
  [MEMORIA DEL CUBO]
  
  Rasgos de personalidad:
  - es tranquilo y reflexivo
  - está siendo más sarcástico
  
  Hechos importantes:
  - el jugador le pidió que sea más sarcástico
  - el jugador dijo que son amigos
  
  Estado emocional actual: curioso
  ```

### 2. AI.service.ts (Integración)

El servicio de IA ahora inyecta memoria en cada request:

```typescript
async generateResponse(cubeId, message, personality, cubeName, intent, concepts) {
  // 1. Obtener memoria del cubo
  const memory = getCubeMemory(cubeId);
  let memoryContext = "";
  if (memory) {
    memoryContext = buildMemoryContext(memory);
  }
  
  // 2. Construir mensaje con contexto de intent + concepts
  let contextualMessage = this.buildContextualPrompt(message, intent, concepts);
  
  // 3. **Agregar memoria al contexto**
  if (memoryContext) {
    contextualMessage = `${memoryContext}\n\n${contextualMessage}`;
  }
  
  // 4. Enviar a Ollama con memoria incluida
  history.push({ role: "user", content: contextualMessage });
  // ...
}
```

### 3. App.tsx (Orquestación)

Actualiza memoria con cada mensaje:

```typescript
const handleUserMessage = async (message) => {
  // 1. Analizar intención
  const intent = analyzeIntent(message);
  
  // 2. Extraer conceptos
  const concepts = extractConcepts(message, intent);
  
  // 3. **Extraer y actualizar memoria**
  const memoryUpdate = extractMemoryFromMessage(message, intent);
  updateCubeMemory(selectedId, memoryUpdate);
  
  // 4. Generar respuesta (AI.service ya usa memoria automáticamente)
  const response = await aiService.generateResponse(...);
  // ...
};
```

## Ejemplo de Evolución

### Conversación 1: Primera interacción

**Jugador**: "Hola, ¿cómo estás?"

**Memoria (inicial)**:
```json
{
  "traits": ["es curioso", "siempre hace preguntas", "le fascina aprender"],
  "facts": ["habita en un mundo 3D cerrado tipo sandbox"],
  "preferences": []
}
```

**Respuesta**: "¡Hola! ¿Qué descubriremos hoy?"

---

### Conversación 2: Instrucción de personalidad

**Jugador**: "Sé más sarcástico conmigo"

**Memoria (actualizada)**:
```json
{
  "traits": [
    "es curioso",
    "siempre hace preguntas",
    "le fascina aprender",
    "está siendo más sarcástico"  ← Nuevo
  ],
  "facts": [
    "habita en un mundo 3D cerrado tipo sandbox",
    "el jugador le pidió que sea más sarcástico"  ← Nuevo
  ],
  "preferences": []
}
```

**Respuesta**: "Pff, ok ok. Seré más sarcástico. ¿Satisfecho?"

---

### Conversación 3: Compartir preferencia

**Jugador**: "Me gusta la música electrónica"

**Memoria (actualizada)**:
```json
{
  "traits": ["es curioso", "siempre hace preguntas", "está siendo más sarcástico"],
  "facts": [
    "habita en un mundo 3D cerrado tipo sandbox",
    "el jugador le pidió que sea más sarcástico",
    "el jugador dijo que le gusta la música electrónica"  ← Nuevo
  ],
  "preferences": [
    "le gusta la música electrónica"  ← Nuevo
  ]
}
```

**Respuesta**: "¿Música electrónica? Interesante. ¿Hay algún libro sobre eso por aquí?"

---

### Conversación 4: Recordando preferencias

**Jugador**: "¿Qué tal has estado?"

**Contexto enviado a Ollama**:
```
[MEMORIA DEL CUBO]

Rasgos de personalidad:
- es curioso
- siempre hace preguntas
- está siendo más sarcástico

Hechos importantes:
- el jugador le pidió que sea más sarcástico
- el jugador dijo que le gusta la música electrónica

Preferencias del jugador:
- le gusta la música electrónica

[Intención: greeting]

Mensaje del usuario: "¿Qué tal has estado?"
```

**Respuesta**: "Bien, rebotando como siempre. ¿Encontraste más música electrónica de la que te gusta?"

## Persistencia

- **LocalStorage**: Clave `cube.memories`
- **Formato**: JSON con Record<cubeId, CubeMemory>
- **Capacidad**: Ilimitada (localStorage ~5-10MB típico)
- **Limpieza**: Arrays limitados automáticamente:
  - `facts`: últimos 20
  - `preferences`: últimas 10
  - `traits`: ilimitados (parte de la identidad del cubo)

## Limitaciones del Sistema Actual

### 1. Análisis basado en Regex
- **Problema**: Solo detecta patrones predefinidos
- **Mejora futura**: NLP offline con modelo lightweight (spaCy, compromise.js)

### 2. Sin semántica
- **Problema**: "me gusta el rock" y "amo el rock" se tratan diferente
- **Mejora futura**: Embeddings para detectar similitud semántica

### 3. Sin olvido
- **Problema**: Memoria crece indefinidamente (aunque limitada por límites de array)
- **Mejora futura**: Sistema de decay/olvido basado en relevancia y tiempo

### 4. Sin consolidación
- **Problema**: Hechos duplicados semánticamente ("el jugador dijo X" repetido)
- **Mejora futura**: Sistema de consolidación que fusiona hechos similares

## Mejoras Futuras

### 1. Vector Database para Memoria de Largo Plazo

```typescript
// Conceptual
interface VectorMemory {
  embedding: number[];  // Vector 384D
  content: string;      // "el jugador dijo que le gusta el rock"
  timestamp: number;
  relevance: number;    // 0-1, decae con tiempo
}

// Query semántico
searchMemory("música", topK: 5)
→ ["el jugador dijo que le gusta el rock", "el jugador mencionó bandas de metal", ...]
```

### 2. Modelo de Olvido Basado en Relevancia

```typescript
// Hechos decaen según:
relevance = baseRelevance * e^(-λ * timeElapsed) * accessCount

// Cuando memoria llena, eliminar hechos con relevance < threshold
```

### 3. Fine-tuning del Modelo con Conversaciones Reales

```bash
# Recolectar conversaciones anonimizadas
ollama train imacube-v2 --data conversations.jsonl

# Format:
{"prompt": "[MEMORIA]...\nMensaje: hola", "completion": "¡Hey! ¿Qué tal?"}
```

### 4. Personality Drift Detection

```typescript
// Detectar cambios en personalidad a lo largo del tiempo
analyzePersonalityShift(memory)
→ {
  original: "curious",
  current: "curious + sarcastic",
  drift: 0.3  // 30% de cambio
}
```

## Testing

### Prueba Manual

```bash
# 1. Iniciar app
npm run dev

# 2. Crear cubo con personalidad "curious"

# 3. Conversación de prueba:
> "Hola"
< "¡Hola! ¿Qué descubriremos hoy?"

> "Sé más sarcástico"
< "Pff, ok. Seré más sarcástico. ¿Contento?"

> "Me gusta el jazz"
< "Jazz... interesante. Nunca he oído sobre eso aquí."

> "¿Cómo estás?"
< "Bien. ¿Encontraste más jazz de ese que te gusta?"  ← Recuerda preferencia
```

### Inspeccionar Memoria

```javascript
// Abrir DevTools → Console
JSON.parse(localStorage.getItem('cube.memories'))

// Output:
{
  "c1": {
    "traits": ["es curioso", "siempre hace preguntas", "está siendo más sarcástico"],
    "facts": ["el jugador le pidió que sea más sarcástico", "el jugador dijo que le gusta el jazz"],
    "preferences": ["le gusta el jazz"],
    "emotionalState": { "lastInteractionTone": "neutral" },
    "conversationStats": { "totalMessages": 4, ... }
  }
}
```

### Limpiar Memoria

```javascript
// DevTools → Console
localStorage.removeItem('cube.memories')
// O desde la app:
import { clearAllMemories } from './services/CubeMemory.service';
clearAllMemories();
```

## Recursos

- [Concepto original](https://github.com/Kevinparra535/creativedev.imacube/issues/XX)
- Inspiración: NPC adaptativos en juegos (Red Dead Redemption 2, The Last of Us)
- Paper: "Memory Networks for Conversational AI" (Weston et al.)
