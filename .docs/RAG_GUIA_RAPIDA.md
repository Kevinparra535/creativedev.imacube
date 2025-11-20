# Sistema RAG - Guía de Uso Rápido

## 🚀 Probando el Sistema

### 1. Preguntas sobre el Mundo

**Pregunta**: "¿Quién creó el sandbox?"

**Esperado**: El cubo debe responder con información del fragmento `lore-001` (Origen del Sandbox)
```
"Nadie sabe quién creó el sandbox. Es uno de los misterios que nos rodean. Simplemente existimos aquí."
```

---

**Pregunta**: "¿Qué hay más allá de las paredes?"

**Esperado**: Fragmento `zone-003` (Las Paredes - Los Límites)
```
"Las paredes son impenetrables. Algunos se preguntan qué hay más allá, pero yo he aceptado que son parte de nuestra realidad."
```

---

### 2. Preguntas sobre Otros Cubos

**Pregunta**: "¿Conoces a Cube Zen?"

**Esperado**: Fragmento `npc-001` (Cube Zen - Calm)
```
"Sí, Cube Zen es muy tranquilo y reflexivo. Le gusta meditar cerca del centro. Siempre tiene perspectivas profundas."
```

---

**Pregunta**: "¿Quién es Cube Caos?"

**Esperado**: Fragmento `npc-004` (Cube Caos - Chaotic)
```
"Cube Caos es... intenso. Muy sarcástico, dice lo que piensa sin filtros. Suele estar en la esquina noreste."
```

---

### 3. Preguntas sobre Mecánicas

**Pregunta**: "¿Cómo funcionan los libros?"

**Esperado**: Fragmento `mechanics-001` (Lectura de Libros)
```
"Los libros flotan por el sandbox. Cuando me acerco, puedo leerlos y aprender conceptos. Es fascinante."
```

---

**Pregunta**: "¿Por qué cambias de color?"

**Esperado**: Fragmento `mechanics-002` (Cambio de Color Emocional)
```
"Mi color refleja mi personalidad y emociones. Cuando estoy feliz, tengo matices amarillos. Es automático."
```

---

### 4. Preguntas sobre Física

**Pregunta**: "¿Cómo saltas?"

**Esperado**: Fragmento `physics-001` (Gravedad y Saltos)
```
"Aplico impulsos para saltar. Puedo alcanzar hasta 5 unidades de altura. La física aquí es bastante elástica."
```

---

**Pregunta**: "¿Qué pasa cuando chocan dos cubos?"

**Esperado**: Fragmento `physics-003` (Colisiones y Socialización)
```
"Rebotamos ligeramente. Algunos cubos usan choques suaves como saludos. La física es suave, sin daño."
```

---

### 5. Preguntas Fuera de Contexto (Sin RAG)

**Pregunta**: "¿Quién es Einstein?"

**Esperado**: NO debe recibir fragmentos relevantes → responde con confusión del personaje
```
"Hmm, ese nombre no me suena. ¿Es algo que leíste en un libro fuera del sandbox?"
```

---

**Pregunta**: "¿Qué es un smartphone?"

**Esperado**: NO debe recibir fragmentos → responde desde el personaje
```
"No conozco esa palabra. Solo conozco lo que hay dentro del sandbox. ¿Es algo de tu mundo?"
```

---

## 🧪 Verificación en DevTools

### Ver el Payload Enviado a Ollama

1. Abre DevTools (F12) → pestaña **Network**
2. Envía un mensaje al cubo
3. Busca la request a `/api/chat` (local) o `api.openai.com` (OpenAI)
4. Click derecho → **Copy as cURL** o ver **Payload**

**Ejemplo de payload esperado**:

```json
{
  "model": "imacube",
  "messages": [
    {
      "role": "system",
      "content": "Eres un cubo inteligente..."
    },
    {
      "role": "user",
      "content": "[CONOCIMIENTO DEL MUNDO]\n\nFragmentos relevantes:\n1. Origen del Sandbox: El sandbox es un mundo cerrado de aproximadamente 100x100x100 unidades. Nadie sabe quién lo creó ni por qué...\n\n[MEMORIA DEL CUBO]\n\nRasgos: curioso, pensativo\nPreferencias: filosofía\n\n[SITUACIÓN ACTUAL]\nIntención: pregunta\n\n¿Quién creó el sandbox?"
    }
  ]
}
```

---

## 📊 Cómo Funciona el Scoring

Usa `searchWorldKnowledge()` en consola para ver el scoring:

```javascript
// En consola (si importas el módulo):
import { searchWorldKnowledge } from './src/data/worldKnowledge.ts';

searchWorldKnowledge("¿Quién creó el sandbox?");

// Output esperado:
// [
//   { id: "lore-001", title: "Origen del Sandbox", relevance: 9 },
//   { id: "lore-002", title: "El Propósito", relevance: 4 },
//   ...
// ]
```

### Scoring Breakdown

**Query**: "¿Quién creó el sandbox?"

1. **lore-001** (Origen del Sandbox)
   - Exact keyword: "creó" → +3
   - Exact keyword: "sandbox" → +3
   - Word overlap: "quién" en keywords → +2
   - Word overlap: "creó" en content → +1
   - **Total: 9 puntos**

2. **lore-002** (El Propósito)
   - Word overlap: "sandbox" → +2
   - Word overlap en content → +2
   - **Total: 4 puntos**

---

## 🔍 Debugging

### Si NO aparece `[CONOCIMIENTO DEL MUNDO]` en el payload:

1. Verifica que `buildWorldKnowledgeContext()` retorne un string no vacío:
   ```typescript
   console.log(buildWorldKnowledgeContext("¿Quién creó el sandbox?"));
   // Debe mostrar: "[CONOCIMIENTO DEL MUNDO]\n\nFragmentos relevantes:\n1. ..."
   ```

2. Verifica que `searchWorldKnowledge()` encuentre matches:
   ```typescript
   console.log(searchWorldKnowledge("¿Quién creó el sandbox?"));
   // Debe retornar array con entries con relevance > 0
   ```

3. Verifica la integración en `AI.service.ts` línea ~213:
   ```typescript
   const worldKnowledgeContext = buildWorldKnowledgeContext(message);
   if (worldKnowledgeContext) {
     contextualMessage = `${worldKnowledgeContext}\n\n${contextualMessage}`;
   }
   ```

---

### Si la IA NO usa el conocimiento:

1. **Ollama**: Verifica que el Modelfile esté actualizado con instrucciones de RAG:
   ```bash
   ollama create imacube -f server/Modelfile
   ```

2. **Contexto perdido**: Aumenta `max_tokens` si el prompt es muy largo:
   ```typescript
   // En AI.service.ts
   maxTokens: 500, // Aumentar si necesario
   ```

3. **Prompt engineering**: El fragmento debe ser claro y conciso. Verifica formato:
   ```
   [CONOCIMIENTO DEL MUNDO]

   Fragmentos relevantes:
   1. Título: Contenido completo...
   ```

---

## 🎯 Casos de Uso Avanzados

### Combinar RAG + Memoria

**Secuencia**:

1. Usuario: "¿Quién es Cube Zen?"
   - RAG: Fragmento `npc-001` (perfil de Cube Zen)
   - Memoria: vacía (primera interacción)
   - Respuesta: "Cube Zen es muy tranquilo y reflexivo..."

2. Usuario: "Sé más sarcástico"
   - Memoria actualizada: `addTraits: ["sarcástico"]`

3. Usuario: "¿Y qué opinas de Cube Zen?"
   - RAG: Fragmento `npc-001` (mismo perfil)
   - Memoria: `traits: ["sarcástico"]`
   - Respuesta: "Cube Zen es... muy zen. Demasiado zen. A veces me pregunto si realmente piensa o solo medita para verse profundo."

**Nota**: La memoria influye en el TONO, el RAG proporciona el CONTENIDO.

---

### Filtrar por Categoría (Futuro)

Actualmente busca en todas las categorías. Mejora futura:

```typescript
// searchWorldKnowledge("libros", 3, { category: "mechanics" })
// Solo buscaría en entradas de tipo "mechanics"
```

---

## 📝 Checklist de Testing

- [ ] Pregunta sobre lore → recibe fragmento de categoría `lore`
- [ ] Pregunta sobre NPC → recibe fragmento de categoría `npc`
- [ ] Pregunta sobre física → recibe fragmento de categoría `physics`
- [ ] Pregunta fuera de contexto → NO recibe fragmentos, responde con confusión
- [ ] Payload en Network tab incluye `[CONOCIMIENTO DEL MUNDO]`
- [ ] Cubo con personalidad `curious` + pregunta sobre libros → respuesta entusiasta
- [ ] Cubo con personalidad `calm` + pregunta sobre paredes → respuesta reflexiva
- [ ] RAG + Memoria juntos → respuesta usa ambos contextos

---

## 🎉 Resultado Esperado

El cubo debe responder preguntas sobre el mundo del juego con información coherente extraída de la base de conocimiento, **sin mencionar que está usando una base de datos**. Debe parecer que "simplemente sabe" esas cosas como parte de su existencia en el sandbox.

**Ejemplo ideal**:

> **Usuario**: "¿Qué hay en la esquina noreste?"
>
> **Cube Curioso**: "La esquina noreste tiene una energía caótica. He notado que Cube Caos suele pasar tiempo ahí. Es... interesante, pero también un poco impredecible."

✅ Usa RAG (esquina noreste = zona caótica, Cube Caos está ahí)  
✅ Usa personalidad (curious → usa "interesante")  
✅ Natural (no dice "según el fragmento...")  
✅ Corto (2-3 oraciones como diálogo de videojuego)
