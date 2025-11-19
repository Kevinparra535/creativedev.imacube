# Servicio de OpenAI - Documentación

## 📋 Descripción

Sistema de integración con OpenAI para generar respuestas contextuales e inteligentes en las conversaciones con los cubos. El sistema funciona en **modo híbrido**: usa OpenAI cuando está configurado, y hace fallback automático a respuestas template-based si falla o no está disponible.

## 🚀 Configuración Inicial

### 1. Crear archivo `.env`

Copia `.env.example` y renómbralo a `.env`:

```bash
cp .env.example .env
```

### 2. Configurar API Key de OpenAI

Edita el archivo `.env` y agrega tu API key:

```env
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_MAX_TOKENS=150
VITE_OPENAI_TEMPERATURE=0.8
```

**Cómo obtener tu API Key:**
1. Ve a [platform.openai.com](https://platform.openai.com)
2. Inicia sesión o crea una cuenta
3. Ve a **API Keys** en el menú
4. Crea una nueva clave secreta
5. Copia la clave (solo se muestra una vez)

### 3. Reiniciar el servidor de desarrollo

```bash
npm run dev
```

El sistema detectará automáticamente la configuración:
- ✅ **Con API Key**: "✅ OpenAI inicializado correctamente"
- ℹ️ **Sin API Key**: "ℹ️ OpenAI no configurado. Usando respuestas template-based."

## 🏗️ Arquitectura

### Componentes Principales

```
OpenAIService.ts         → Servicio principal (singleton)
openai.config.ts         → Configuración desde .env
InteractionSystem.ts     → Sistema de análisis de intención
App.tsx                  → Integración y lógica híbrida
```

### Flujo de Conversación

```
Usuario escribe mensaje
    ↓
analyzeIntent() + extractConcepts()
    ↓
¿OpenAI configurado? ──NO──→ generateResponse() (template)
    ↓ SÍ                            ↓
OpenAIService.generateResponse()    ↓
    ↓                               ↓
¿Éxito? ──NO──→ Fallback template  ↓
    ↓ SÍ                            ↓
    └───────→ Respuesta final ←─────┘
```

## 📚 API del Servicio

### `OpenAIService`

#### Métodos Principales

##### `initializeOpenAI(apiKey, config?)`
Inicializa el servicio singleton.

```typescript
import { initializeOpenAI } from "./scene/systems/OpenAIService";

const service = initializeOpenAI("sk-proj-xxx", {
  model: "gpt-4o-mini",
  maxTokens: 150,
  temperature: 0.8,
});
```

##### `getOpenAIService()`
Obtiene la instancia del servicio (debe inicializarse primero).

```typescript
import { getOpenAIService } from "./scene/systems/OpenAIService";

const service = getOpenAIService();
const response = await service.generateResponse(
  cubeId,
  message,
  personality,
  cubeName,
  intent,
  concepts
);
```

##### `isOpenAIInitialized()`
Verifica si el servicio está listo.

```typescript
import { isOpenAIInitialized } from "./scene/systems/OpenAIService";

if (isOpenAIInitialized()) {
  // Usar OpenAI
} else {
  // Usar fallback
}
```

### Métodos de Instancia

#### `generateResponse(cubeId, message, personality, cubeName, intent?, concepts?)`

Genera una respuesta usando OpenAI.

**Parámetros:**
- `cubeId`: ID único del cubo
- `message`: Mensaje del usuario
- `personality`: Personalidad del cubo (`calm`, `curious`, `extrovert`, `chaotic`, `neutral`)
- `cubeName`: Nombre del cubo
- `intent`: Intención detectada (opcional, mejora el contexto)
- `concepts`: Conceptos extraídos (opcional, mejora el contexto)

**Retorna:**
```typescript
{
  success: boolean;
  response?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

**Ejemplo:**
```typescript
const result = await service.generateResponse(
  "c1",
  "Hola, ¿cómo estás?",
  "curious",
  "Cube Curioso"
);

if (result.success) {
  console.log(result.response); // "¡Hola! ¿Qué descubriremos hoy?"
  console.log(result.usage?.totalTokens); // 45
}
```

#### `clearHistory(cubeId)`

Limpia el historial de conversación de un cubo.

```typescript
service.clearHistory("c1");
```

#### `getHistory(cubeId)`

Obtiene el historial completo (debugging).

```typescript
const history = service.getHistory("c1");
console.log(history);
// [
//   { role: "system", content: "Eres un cubo..." },
//   { role: "user", content: "Hola" },
//   { role: "assistant", content: "¡Hola! ¿Qué..." }
// ]
```

#### `updateApiKey(apiKey)`

Actualiza la API key en tiempo de ejecución.

```typescript
service.updateApiKey("sk-proj-nueva-clave");
```

#### `updateConfig(config)`

Actualiza la configuración parcialmente.

```typescript
service.updateConfig({
  temperature: 0.9,
  maxTokens: 200,
});
```

## 🎭 Prompts de Personalidad

Cada personalidad tiene un **system prompt** único que define su forma de hablar:

### Calm (Tranquilo)
```
- Hablas con calma y reflexión
- Respondes de forma filosófica
- Evitas la prisa y el exceso de entusiasmo
- Frases cortas y pausadas
```

### Curious (Curioso)
```
- Siempre haces preguntas
- Te fascina aprender cosas nuevas
- Respondes con entusiasmo por el conocimiento
- Usas "hmm", "interesante", "¿y si...?"
```

### Extrovert (Extrovertido)
```
- Muy entusiasta y energético
- Te encanta conectar con el usuario
- Respondes con calidez y cercanía
- Usas exclamaciones frecuentes
```

### Chaotic (Caótico)
```
- Impredecible y sarcástico
- No sigues reglas sociales
- Respondes de forma directa, a veces brusca
- Sentido del humor oscuro
```

### Neutral (Neutral)
```
- Objetivo y sin emociones fuertes
- Respondes de forma clara y directa
- Te enfocas en hechos y datos
- Frases claras y concisas
```

## 🧠 Contexto Enriquecido

El servicio **enriquece** cada mensaje con contexto detectado:

```typescript
// Mensaje del usuario: "Estoy triste hoy"

// Se envía a OpenAI:
[Intención detectada: emotion_sharing]
[Emociones mencionadas: triste]
[Tono: negative]

Mensaje del usuario: "Estoy triste hoy"
```

Esto ayuda al modelo a generar respuestas más empáticas y contextuales.

## 💾 Gestión de Historial

- Se mantienen los **últimos 10 mensajes** por cubo
- El **system prompt** siempre se conserva
- Se evita el desbordamiento de tokens
- Cada cubo tiene su propio contexto independiente

```typescript
// Cubo 1: Conversación sobre filosofía
// Cubo 2: Conversación sobre matemáticas
// Los historiales NO se mezclan
```

## ⚙️ Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_OPENAI_API_KEY` | API Key de OpenAI | `""` (obligatorio) |
| `VITE_OPENAI_MODEL` | Modelo a usar | `gpt-4o-mini` |
| `VITE_OPENAI_MAX_TOKENS` | Tokens máximos de respuesta | `150` |
| `VITE_OPENAI_TEMPERATURE` | Creatividad (0-2) | `0.8` |

### Modelos Recomendados

| Modelo | Velocidad | Costo | Calidad | Uso recomendado |
|--------|-----------|-------|---------|-----------------|
| `gpt-4o-mini` | ⚡⚡⚡ | 💰 | ⭐⭐⭐ | **Recomendado** - Rápido y económico |
| `gpt-4o` | ⚡⚡ | 💰💰💰 | ⭐⭐⭐⭐⭐ | Máxima calidad |
| `gpt-3.5-turbo` | ⚡⚡⚡ | 💰 | ⭐⭐ | Más económico |

### Ajustar Temperatura

```typescript
// Más creativo y variado (0.8 - 1.2)
VITE_OPENAI_TEMPERATURE=1.0

// Más consistente y predecible (0.3 - 0.7)
VITE_OPENAI_TEMPERATURE=0.5
```

## 🔒 Seguridad

### ✅ Buenas Prácticas

- ✅ API Key en `.env` (nunca en el código)
- ✅ `.env` en `.gitignore`
- ✅ Usar variables de entorno de Vite (`VITE_`)
- ✅ Validar respuestas antes de mostrar

### ❌ NO Hacer

- ❌ Commitear el archivo `.env`
- ❌ Exponer la API Key en el frontend (solo desarrollo local)
- ❌ Usar la misma key en producción y desarrollo

### 🛡️ Para Producción

Para producción, considera:
1. **Backend proxy**: Crear un servidor que haga las llamadas a OpenAI
2. **Rate limiting**: Limitar llamadas por usuario
3. **Autenticación**: Solo usuarios autenticados pueden conversar
4. **Monitoreo de costos**: Configurar alertas en OpenAI

## 📊 Costos Estimados

Con `gpt-4o-mini` (más económico):

- **Input**: ~$0.15 / 1M tokens
- **Output**: ~$0.60 / 1M tokens

**Ejemplo de conversación:**
- Mensaje: ~50 tokens
- Respuesta: ~40 tokens
- **Total**: ~90 tokens ≈ **$0.00005** por mensaje

**Estimación mensual:**
- 1000 mensajes/mes: ~**$0.05**
- 10,000 mensajes/mes: ~**$0.50**

## 🐛 Debugging

### Ver logs en consola

```typescript
// Activar logs detallados
console.log("🤖 Respuesta de OpenAI:", result);
console.log("Tokens usados:", result.usage?.totalTokens);
```

### Ver historial de conversación

```typescript
import { getOpenAIService } from "./scene/systems/OpenAIService";

const service = getOpenAIService();
const history = service.getHistory("c1");
console.table(history);
```

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | API Key inválida | Verificar `VITE_OPENAI_API_KEY` |
| `429 Rate Limit` | Demasiadas llamadas | Esperar o aumentar límite |
| `500 Server Error` | Error de OpenAI | Reintentar o usar fallback |
| Service not initialized | No se llamó `initializeOpenAI()` | Verificar `useEffect` en App.tsx |

## 🎯 Ejemplos de Uso

### Ejemplo 1: Conversación Básica

```typescript
// Usuario: "Hola"
// Cube Curious responde: "¡Hola! ¿Qué descubriremos hoy?"

// Usuario: "¿Qué sabes sobre física cuántica?"
// Cube Curious: "¡Oh, física cuántica! Es fascinante. ¿Sabías que
// las partículas pueden estar en dos lugares a la vez? ¿Qué te
// intriga más: el entrelazamiento o la superposición?"
```

### Ejemplo 2: Cambio de Personalidad

```typescript
// Mismo mensaje, diferente personalidad

// Cube Calm: "La física cuántica es un campo profundo. Requiere
// paciencia y contemplación para comprender sus misterios."

// Cube Chaotic: "Pff, física cuántica. Todo es probabilidad y
// confusión. Pero es cool, supongo."
```

### Ejemplo 3: Contexto Emocional

```typescript
// Usuario: "Estoy frustrado con este problema"
// [Intención: emotion_sharing]
// [Emociones: frustrado]
// [Tono: negative]

// Cube Extrovert: "Oye, entiendo tu frustración. ¡Pero no te
// rindas! Estoy aquí para ayudarte. ¿Qué problema es?"

// Cube Neutral: "Entiendo. La frustración es común al enfrentar
// problemas complejos. ¿Puedes describir el problema?"
```

## 🚀 Próximos Pasos

### Fase 1: Memoria de Largo Plazo
- Guardar conversaciones en localStorage
- Recordar preferencias del usuario
- Contexto que persiste entre sesiones

### Fase 2: Fine-tuning
- Entrenar modelos específicos por personalidad
- Respuestas aún más coherentes
- Reducir costos

### Fase 3: Multimodal
- Integrar visión (describir escenas 3D)
- Text-to-speech para voz del cubo
- Análisis de emociones en tiempo real

## 📝 Resumen

El servicio de OpenAI proporciona:

✅ **Respuestas inteligentes** adaptadas a la personalidad del cubo
✅ **Contexto enriquecido** con análisis de intención y emociones
✅ **Fallback automático** a respuestas template si falla
✅ **Gestión de historial** por cubo (últimos 10 mensajes)
✅ **Configuración flexible** vía variables de entorno
✅ **Costos bajos** con `gpt-4o-mini`
✅ **Seguridad** con API keys en `.env`

El sistema está listo para producir conversaciones naturales y coherentes que hacen sentir a los cubos verdaderamente **vivos e inteligentes**. 🎉
