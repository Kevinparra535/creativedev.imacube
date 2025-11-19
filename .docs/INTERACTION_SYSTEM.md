# Sistema de Interacción con los Cubos

## Arquitectura del Bucle Cognitivo

El sistema de interacción implementa el ciclo teórico:

```
Percibido → Interpretado → Procesado → Expresado
```

### Componentes del Sistema

#### 1. **CubeInteraction.tsx** (Interfaz de Usuario)
- Panel de conversación en la parte inferior izquierda
- Input de texto para mensajes del usuario
- Visualización de historial de conversación
- Indicador de "pensando" durante procesamiento
- Auto-scroll y gestión de estado de conversación

#### 2. **InteractionSystem.ts** (Núcleo Cognitivo)
Motor de interpretación y respuesta que procesa mensajes según:

##### **Análisis de Intención (`analyzeIntent`)**
Detecta qué tipo de mensaje envió el usuario:
- `greeting`: Saludos y casual talk
- `preference`: Expresión de gustos/preferencias
- `instruction`: Órdenes sobre comportamiento/personalidad
- `emotion_sharing`: Usuario comparte emociones
- `question`: Preguntas al cubo
- `observation`: Comentarios sobre el cubo
- `praise`: Elogios
- `criticism`: Críticas
- `philosophy`: Conversaciones profundas
- `casual`: Charla general

##### **Extracción de Conceptos (`extractConcepts`)**
Extrae información clave del mensaje:
```typescript
{
  emotions?: string[];        // Emociones mencionadas
  preferences?: string[];     // Preferencias expresadas
  personalityHints?: string[]; // Sugerencias de personalidad
  topics?: string[];          // Temas de conversación
  tone?: "positive" | "negative" | "neutral";
}
```

##### **Generación de Respuesta (`generateResponse`)**
Genera respuestas coherentes con la personalidad del cubo:
- **Calm**: Reflexivo, medido, filosófico
- **Curious**: Inquisitivo, hace preguntas, quiere aprender
- **Extrovert**: Enérgico, entusiasta, social
- **Chaotic**: Impredecible, sarcástico, directo
- **Neutral**: Objetivo, informativo, sin emoción fuerte

Ejemplo de respuestas por personalidad:
```typescript
// Saludo + Curious
"¡Hola! ¿Qué descubriremos hoy?"

// Saludo + Calm  
"Hola. Es agradable conectar contigo."

// Saludo + Extrovert
"¡Hola! ¡Qué bueno verte!"
```

##### **Efectos Visuales (`generateVisualEffects`)**
Genera feedback visual basado en la interacción:
```typescript
{
  colorShift?: string;        // Color temporal
  pulseStrength?: number;     // Intensidad del pulso de luz
  scaleChange?: number;       // Cambio de escala temporal
  emissiveBoost?: number;     // Boost de emissive
  animationType?: "excited" | "calm" | "sad" | "thinking" | "neutral";
}
```

#### 3. **App.tsx** (Orquestador)
Maneja el flujo completo:

```typescript
handleUserMessage(message) {
  1. Activar indicador "pensando" (200-1500ms delay realista)
  2. Analizar intención del mensaje
  3. Extraer conceptos clave
  4. Obtener personalidad del cubo seleccionado
  5. Generar respuesta coherente
  6. Generar efectos visuales
  7. Mostrar respuesta al usuario
  8. Aplicar efectos visuales al cubo (3s de duración)
}
```

## Flujo de Interacción Típica

### Ejemplo 1: Usuario Saluda

```
Usuario: "Hola, ¿cómo estás?"

1. Intent: greeting
2. Concepts: { tone: "neutral" }
3. Personality: curious
4. Response: "¡Hola! ¿Qué descubriremos hoy?"
5. Visual: animationType: "excited", pulseStrength: 0.5
```

### Ejemplo 2: Usuario Comparte Emoción

```
Usuario: "Estoy triste hoy"

1. Intent: emotion_sharing
2. Concepts: { emotions: ["triste"], tone: "negative" }
3. Personality: calm
4. Response: "Lamento que te sientas así. Estoy aquí."
5. Visual: colorShift: "#3f51b5" (azul), emissiveBoost: -0.2
```

### Ejemplo 3: Usuario Da Instrucción

```
Usuario: "Sé más sarcástico"

1. Intent: instruction
2. Concepts: { personalityHints: ["sarcastic"], tone: "neutral" }
3. Personality: chaotic
4. Response: "Mmm, tal vez... o tal vez NO."
5. Visual: animationType: "thinking", emissiveBoost: 0.3
```

## Características del Sistema

### ✅ Feedback Inmediato
- Respuesta visual en <150ms (selección)
- Respuesta verbal en 200-1500ms (delay realista de "pensamiento")

### ✅ Coherencia Contextual
- Las respuestas dependen de la personalidad actual del cubo
- El tono se adapta al tipo de mensaje
- Los efectos visuales refuerzan la respuesta

### ✅ Multimodalidad
- **Texto**: Mensaje escrito del usuario
- **Visual**: Cambios en color, luz, animación
- **Estado interno**: Emociones, memoria (futuro)
- **Motor 3D**: El cubo "siente" corporalmente

### ✅ Relación Progresiva
El sistema está preparado para:
- Memoria de conversaciones previas
- Modificación de personalidad basada en interacciones
- Aprendizaje de preferencias del usuario
- Construcción de apego mutuo

## Uso en Código

### En el componente padre:
```tsx
import CubeInteraction from "./components/CubeInteraction";

<CubeInteraction
  cubeId={selectedId}
  cubeName="Cube 1"
  cubePersonality="curious"
  onSendMessage={handleUserMessage}
  cubeResponse={cubeResponse}
  isThinking={isThinking}
/>
```

### Procesamiento del mensaje:
```typescript
const handleUserMessage = (message: string) => {
  const intent = analyzeIntent(message);
  const concepts = extractConcepts(message, intent);
  const response = generateResponse(
    message,
    intent,
    concepts,
    personality,
    cubeName
  );
  const effects = generateVisualEffects(intent, concepts);
  
  // Apply response and effects...
};
```

## Próximos Pasos (Fases Futuras)

### Fase 1: Memoria Persistente
- Almacenar conversaciones en localStorage
- Recordar preferencias del usuario
- Detectar patrones en interacciones

### Fase 2: Modificación de Personalidad
- Cambios graduales basados en instrucciones
- Evolución natural por interacción frecuente
- Sistema de traits influenciados por usuario

### Fase 3: IA Offline
- Integrar modelo generativo local (LLaMA, Mistral, etc.)
- Respuestas más naturales y contextuales
- Comprensión semántica profunda

### Fase 4: Interacción Física
- Gestos del usuario (webcam)
- Reconocimiento de voz
- Respuestas hápticas (vibración)

## Teoría Aplicada

Este sistema implementa conceptos de:
- **Agentes Cognitivos**: Percepción, procesamiento, acción
- **Embodied AI**: La mente "vive" en un cuerpo 3D
- **Multimodal Interaction**: Texto + visual + estado interno
- **Co-adaptation**: Usuario y cubo se influencian mutuamente
- **Affective Computing**: Detección y expresión de emociones

El resultado es un **agente inteligente interactivo** que no solo responde, sino que **siente, aprende y evoluciona** con cada conversación.
