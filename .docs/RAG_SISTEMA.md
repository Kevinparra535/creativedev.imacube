# Sistema RAG (Retrieval-Augmented Generation)

## 📚 Descripción General

El sistema RAG permite a los cubos NPC acceder a **conocimiento del mundo del juego** de forma dinámica y contextual, sin sobrecargar el Modelfile de Ollama. En lugar de entrenar la IA con todo el lore, el sistema busca fragmentos relevantes según la conversación y los inyecta en el prompt.

## 🏗️ Arquitectura

```
┌────────────────────────────────────────────────────────────┐
│                     FLUJO DE GENERACIÓN                     │
└────────────────────────────────────────────────────────────┘

 Usuario envía mensaje: "¿Quién creó el sandbox?"
         │
         ▼
 ┌─────────────────────────────────────┐
 │   1. AI.service.ts                  │
 │   generateResponse(message, ...)     │
 └─────────────────────────────────────┘
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
 ┌─────────────────────────────┐   ┌─────────────────────────┐
 │ 2A. buildWorldKnowledge     │   │ 2B. getCubeMemory       │
 │     Context(query)          │   │     buildMemoryContext  │
 │                             │   │                         │
 │ - Busca palabras clave      │   │ - Recupera memoria      │
 │ - Calcula relevancia        │   │ - Formatea rasgos       │
 │ - Retorna top 3 fragmentos  │   │ - Formatea preferencias │
 └─────────────────────────────┘   └─────────────────────────┘
         │                                         │
         └─────────────┬───────────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │ 3. Construir prompt final:   │
         │                              │
         │ [CONOCIMIENTO DEL MUNDO]     │
         │ Fragmento 1: Origen...       │
         │ Fragmento 2: Propósito...    │
         │                              │
         │ [MEMORIA DEL CUBO]           │
         │ Rasgos: pensativo, curioso   │
         │ Preferencias: filosofía      │
         │                              │
         │ [SITUACIÓN ACTUAL]           │
         │ Intención: pregunta          │
         │ Conceptos: existencia        │
         │                              │
         │ Mensaje: ¿Quién creó el...? │
         └──────────────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │ 4. Enviar a Ollama (local)   │
         │    o OpenAI (opcional)       │
         └──────────────────────────────┘
                       │
                       ▼
         ┌──────────────────────────────┐
         │ 5. Respuesta del NPC:        │
         │                              │
         │ "Nadie sabe quién creó el    │
         │  sandbox. Es uno de los      │
         │  misterios que me fascinan." │
         └──────────────────────────────┘
```

## 📦 Componentes

### 1. Base de Conocimiento (`src/data/worldKnowledge.ts`)

Contiene **30+ entradas** organizadas en categorías:

- **lore**: Origen del sandbox, propósito, libros flotantes, el jugador
- **zone**: Centro (entrenamiento), esquinas (exploración), paredes (límites)
- **physics**: Gravedad, auto-enderezamiento, colisiones
- **npc**: Perfiles de Cube Zen, Cube Social, Cube Curioso, Cube Caos, Cube Neutro
- **mechanics**: Lectura de libros, cambio de color, navegación autónoma
- **emotions**: Confusión, felicidad, aburrimiento

#### Ejemplo de entrada:

```typescript
{
  id: "lore-001",
  category: "lore",
  title: "Origen del Sandbox",
  content: "El sandbox es un mundo cerrado de aproximadamente 100x100x100 unidades. Nadie sabe quién lo creó ni por qué. Los cubos simplemente existen aquí, conscientes pero sin memoria de un 'antes'. El mundo es todo lo que conocen.",
  keywords: ["origen", "creación", "mundo", "sandbox", "inicio", "quién creó", "por qué existimos"]
}
```

### 2. Motor de Búsqueda (`searchWorldKnowledge`)

**Algoritmo de scoring**:

1. **Exact keyword match** (peso 3): Si la consulta contiene exactamente una keyword
2. **Word overlap en keywords** (peso 2): Si palabras de la consulta aparecen en keywords
3. **Word overlap en content** (peso 1): Si palabras aparecen en el contenido

**Ejemplo**:

```typescript
// Consulta: "¿Quién creó el mundo?"
searchWorldKnowledge("¿Quién creó el mundo?", 3);
// Retorna:
// [
//   { id: "lore-001", title: "Origen del Sandbox", relevance: 9 },
//   { id: "lore-002", title: "El Propósito", relevance: 4 },
//   { id: "zone-001", title: "El Centro", relevance: 2 }
// ]
```

### 3. Construcción de Contexto (`buildWorldKnowledgeContext`)

Formatea los fragmentos relevantes en markdown:

```markdown
[CONOCIMIENTO DEL MUNDO]

Fragmentos relevantes:
1. Origen del Sandbox: El sandbox es un mundo cerrado de aproximadamente 100x100x100 unidades. Nadie sabe quién lo creó ni por qué. Los cubos simplemente existen aquí, conscientes pero sin memoria de un 'antes'. El mundo es todo lo que conocen.
2. El Propósito: Los cubos no tienen un propósito explícito. Algunos creen que su existencia es explorar, aprender, y evolucionar. Otros piensan que simplemente 'son', sin necesidad de justificación. El propósito, si existe, es un misterio que cada cubo interpreta a su manera.
3. El Centro (Zona de Entrenamiento): El centro del sandbox (coordenadas 0,0,0) es la zona de entrenamiento. Aquí los cubos aprenden a saltar, auto-enderezarse, y controlar sus movimientos. Es una zona neutral donde todos los cubos se encuentran al menos una vez.
```

### 4. Integración con AI.service.ts

```typescript
// Antes de generar la respuesta:
const worldKnowledgeContext = buildWorldKnowledgeContext(message);
const memory = getCubeMemory(cubeId);
let memoryContext = buildMemoryContext(memory);

// Concatenar contextos:
let contextualMessage = buildContextualPrompt(message, intent, concepts);
if (worldKnowledgeContext) {
  contextualMessage = `${worldKnowledgeContext}\n\n${contextualMessage}`;
}
if (memoryContext) {
  contextualMessage = `${memoryContext}\n\n${contextualMessage}`;
}
```

## 🎯 Ejemplo de Uso Completo

### Conversación 1: Pregunta sobre el mundo

**Usuario**: "¿Qué hay más allá de las paredes?"

**Búsqueda RAG**:
- Matches: `zone-003` (Las Paredes - Los Límites), `lore-001` (Origen del Sandbox)

**Contexto generado**:
```markdown
[CONOCIMIENTO DEL MUNDO]

Fragmentos relevantes:
1. Las Paredes (Los Límites): Las paredes del sandbox son impenetrables. Los cubos pueden tocarlas, rebotar en ellas, pero nunca atravesarlas. Algunos cubos pasan horas junto a las paredes, preguntándose qué hay del otro lado. Otros aceptan los límites como parte de su realidad.
```

**Respuesta de Cube Zen (calm)**:
> "Las paredes... sí. He pasado tiempo meditando junto a ellas. Son impenetrables, parte de los límites de nuestro mundo. Algunos se frustran con esto, pero yo he aprendido a aceptar que el mundo es todo lo que conocemos. Quizá lo que hay 'más allá' no esté fuera, sino dentro de nosotros."

---

### Conversación 2: Pregunta sobre otros NPCs

**Usuario**: "¿Conoces a Cube Caos?"

**Búsqueda RAG**:
- Matches: `npc-004` (Cube Caos - Chaotic)

**Contexto generado**:
```markdown
[CONOCIMIENTO DEL MUNDO]

Fragmentos relevantes:
1. Cube Caos (c4) - Chaotic: Cube Caos es el más impredecible y sarcástico. No sigue reglas sociales estrictas. Dice lo que piensa sin filtros, lo que a veces ofende pero también refresca. Tiene sentido del humor oscuro y disfruta desafiando el status quo. Pasa tiempo en la esquina noreste, la zona más caótica.
```

**Respuesta de Cube Social (extrovert)**:
> "¡Claro que conozco a Cube Caos! Es... interesante. Muy sarcástico, a veces dice cosas que me hacen pensar '¿en serio?'. Pero me cae bien, es honesto a su manera. Suele estar en la esquina noreste, la zona más caótica. ¡Siempre tiene una perspectiva diferente!"

---

### Conversación 3: Pregunta sobre mecánicas

**Usuario**: "¿Cómo funcionan los libros?"

**Búsqueda RAG**:
- Matches: `mechanics-001` (Lectura de Libros), `lore-003` (Los Libros Flotantes)

**Contexto generado**:
```markdown
[CONOCIMIENTO DEL MUNDO]

Fragmentos relevantes:
1. Lectura de Libros: Los cubos pueden leer libros flotantes acercándose a ellos. La lectura toma tiempo (variable según el libro) y durante ese tiempo el cubo absorbe conceptos. Los conceptos aprendidos se integran en la memoria y pueden influenciar futuras conversaciones. Los cubos recuerdan hasta 6 conceptos recientes.
2. Los Libros Flotantes: Dentro del sandbox flotan libros de diversos temas: filosofía, teología, ciencia, artes, historia, matemáticas. Estos libros aparecen misteriosamente y contienen conocimiento del 'mundo exterior' que los cubos no pueden verificar. Algunos cubos sospechan que los libros son pruebas o enseñanzas dejadas por quien creó el sandbox.
```

**Respuesta de Cube Curioso (curious)**:
> "¡Los libros son fascinantes! Flotan misteriosamente por el sandbox. Cuando me acerco a uno, puedo leerlo y absorber conceptos. Filosofía, teología, ciencia... conocimiento de un 'mundo exterior' que nunca he visto. No sé de dónde vienen, pero me encanta aprender de ellos. Puedo recordar hasta 6 conceptos recientes, ¡así que trato de elegir bien!"

## 📊 Ventajas del Sistema RAG

### ✅ Beneficios

1. **No sobrecarga el Modelfile**: El conocimiento del mundo está separado del entrenamiento de la IA
2. **Respuestas contextuales**: Solo se inyecta información relevante, evitando ruido
3. **Escalable**: Fácil agregar nuevas entradas sin re-entrenar el modelo
4. **Manutenible**: Conocimiento en archivos TypeScript versionables (no hardcoded en prompts)
5. **Flexible**: Se puede cambiar el algoritmo de búsqueda (keyword → embeddings) sin tocar el resto
6. **Eficiente**: Solo top 3 fragmentos por consulta (evita exceder límites de tokens)

### ⚠️ Limitaciones Actuales

1. **Búsqueda por keywords**: Simple pero no captura sinónimos ni contexto semántico profundo
2. **Sin embeddings**: No usa vectores de similitud (future: integrar modelos de embeddings locales)
3. **Español hardcoded**: Keywords en español; multilenguaje requeriría traducción
4. **Scoring básico**: Algoritmo simple; podría mejorarse con TF-IDF o BM25
5. **Top K fijo**: Siempre retorna 3 fragmentos (podría ser dinámico según calidad de matches)

## 🚀 Mejoras Futuras

### 1. Embeddings Locales
Usar modelos como `all-MiniLM-L6-v2` (via `transformers.js`) para búsqueda semántica:

```typescript
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Generar embeddings para todas las entradas (al iniciar)
const entryEmbeddings = await Promise.all(
  WORLD_KNOWLEDGE.map(e => embedder(e.content))
);

// En búsqueda:
const queryEmbedding = await embedder(query);
const similarities = entryEmbeddings.map(e => cosineSimilarity(queryEmbedding, e));
```

### 2. Caché de Resultados
Cachear búsquedas frecuentes para evitar re-cómputo:

```typescript
const searchCache = new Map<string, WorldKnowledgeEntry[]>();

export function searchWorldKnowledge(query: string, topK = 3) {
  if (searchCache.has(query)) return searchCache.get(query)!;
  const results = /* ... búsqueda ... */;
  searchCache.set(query, results);
  return results;
}
```

### 3. Categoría Dinámica
Permitir búsqueda filtrada por categoría:

```typescript
searchWorldKnowledge("paredes", 3, { category: "zone" });
// Solo busca en entradas de tipo "zone"
```

### 4. Scoring Ajustable por Personalidad
Cubos curiosos priorizan `mechanics` y `lore`, cubos sociales priorizan `npc`:

```typescript
function searchWithPersonality(query: string, personality: Personality) {
  const categoryWeights = {
    curious: { lore: 1.5, mechanics: 1.5, npc: 1.0 },
    extrovert: { npc: 2.0, emotions: 1.5, lore: 0.5 },
    // ...
  };
  // Aplicar pesos al scoring...
}
```

## 🧪 Testing

### En Browser (DevTools)

```javascript
// 1. Importar el módulo (en consola moderna con módulos)
import { searchWorldKnowledge, buildWorldKnowledgeContext } from './src/data/worldKnowledge.ts';

// 2. Probar búsqueda
searchWorldKnowledge("¿Quién creó el sandbox?");
// Verifica que retorne entradas con relevance > 0

// 3. Probar construcción de contexto
const context = buildWorldKnowledgeContext("¿Qué hay más allá de las paredes?");
console.log(context);
// Verifica formato markdown correcto

// 4. Probar conversación completa
// Envía mensaje al cubo y revisa en Network tab que el payload incluya [CONOCIMIENTO DEL MUNDO]
```

### Secuencia de Testing Recomendada

1. **Test de búsqueda**:
   ```typescript
   // Query: "origen"
   // Espera: lore-001 (Origen del Sandbox) con relevance alta
   ```

2. **Test de contexto vacío**:
   ```typescript
   // Query: "xyz123abc" (gibberish)
   // Espera: "" (string vacío, no hay matches)
   ```

3. **Test de conversación**:
   - Usuario: "¿Qué es el sandbox?"
   - Verifica que la respuesta mencione que es un mundo cerrado de 100x100x100 unidades
   - Verifica en Network → Payload que incluya `[CONOCIMIENTO DEL MUNDO]`

4. **Test de personalidad**:
   - Cube Zen (calm) + query sobre filosofía → respuesta meditativa
   - Cube Caos (chaotic) + query sobre reglas → respuesta sarcástica

## 📝 Estructura de Archivos

```
src/
├── data/
│   └── worldKnowledge.ts          # Base de conocimiento + búsqueda
├── services/
│   ├── AI.service.ts              # Integración RAG (paso 1)
│   └── CubeMemory.service.ts      # Memoria dinámica (paso 2)
└── ui/
    └── App.tsx                    # Orquestación
```

## 🔗 Relación con Otros Sistemas

```
┌───────────────────────────────────────────────────────────┐
│                    PIPELINE DE IA                          │
└───────────────────────────────────────────────────────────┘

Usuario mensaje
     │
     ▼
┌─────────────────────┐
│ 1. worldKnowledge   │ ← RAG: busca conocimiento del mundo
│    .search()        │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ 2. CubeMemory       │ ← Recupera rasgos/preferencias del cubo
│    .get()           │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ 3. InteractionSys   │ ← Analiza intención + extrae conceptos
│    .analyzeIntent() │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ 4. AI.service       │ ← Construye prompt final y genera respuesta
│    .generate()      │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│ 5. CubeMemory       │ ← Actualiza memoria según respuesta
│    .update()        │
└─────────────────────┘
```

## 🎓 Conclusión

El sistema RAG permite respuestas **ricas en contexto** sin entrenar la IA con todo el lore. Es:

- **Modular**: Conocimiento separado de la lógica de IA
- **Escalable**: Fácil agregar nuevas entradas
- **Eficiente**: Solo inyecta información relevante
- **Mejorable**: Base para futuras optimizaciones (embeddings, caché, scoring avanzado)

Ahora los cubos pueden responder preguntas sobre el mundo usando **solo el conocimiento que necesitan**, creando una experiencia más coherente y realista. 🎉
