# Configuración de Ollama para creativedev.imacube

Este documento explica cómo configurar y entrenar el modelo local de Ollama para los cubos inteligentes.

## Requisitos Previos

1. **Ollama instalado**: [Descargar aquí](https://ollama.ai/download)
2. **Modelo base descargado**:
   ```pwsh
   ollama pull llama3.1
   ```

## Crear el Modelo Personalizado

El archivo `Modelfile` en la raíz del proyecto contiene la configuración completa del modelo.

### 1. Crear el modelo desde el Modelfile

```pwsh
# Desde la raíz del proyecto
ollama create imacube -f Modelfile
```

Este comando:
- Lee el `Modelfile`
- Usa `llama3.1` como base
- Aplica el system prompt personalizado
- Configura los parámetros de generación
- Entrena con los ejemplos few-shot

### 2. Verificar que se creó correctamente

```pwsh
ollama list
```

Deberías ver `imacube` en la lista de modelos.

### 3. Probar el modelo en consola

```pwsh
ollama run imacube
```

Prueba con preguntas como:
- "Hola, ¿cómo estás?"
- "¿Qué libros has leído?"
- "¿Conoces a Albert Einstein?" (debería responder que no conoce el mundo real)
- "Salta más alto" (debería responder con personalidad, no obedecer ciegamente)

## Configurar el Backend Local

### Opción A: Usar Ollama directamente (Puerto 11434)

Ollama por defecto corre en `http://localhost:11434`.

**Archivo `.env`:**
```env
VITE_AI_BACKEND=local
VITE_LOCAL_AI_URL=http://localhost:11434/api/chat
VITE_LOCAL_AI_MODEL=imacube
```

### Opción B: Proxy personalizado (Puerto 3001)

Si prefieres usar un servidor proxy intermedio (recomendado para agregar lógica adicional):

**Crear `server/proxy.js`:**
```javascript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'imacube',
        messages,
        stream: false
      })
    });

    const data = await response.json();
    res.json({ response: data.message.content });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Error connecting to Ollama' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy running on http://localhost:${PORT}`);
});
```

**Archivo `.env`:**
```env
VITE_AI_BACKEND=local
VITE_LOCAL_AI_URL=http://localhost:3001/api/chat
VITE_LOCAL_AI_MODEL=imacube
```

**Ejecutar el proxy:**
```pwsh
node server/proxy.js
```

## Actualizar el Modelo

Si modificas el `Modelfile`, recrea el modelo:

```pwsh
# Elimina el modelo anterior
ollama rm imacube

# Crea el nuevo
ollama create imacube -f Modelfile

# Verifica
ollama run imacube
```

## Parámetros del Modelo

Los parámetros en `Modelfile` controlan el comportamiento del modelo:

| Parámetro | Valor | Efecto |
|-----------|-------|--------|
| `temperature` | 0.8 | Balance creatividad/coherencia (0=determinista, 1=creativo) |
| `top_p` | 0.9 | Diversidad de respuestas (nucleus sampling) |
| `top_k` | 40 | Vocabulario activo (limita palabras candidatas) |
| `repeat_penalty` | 1.1 | Penaliza repeticiones (reduce frases iguales) |
| `stop` | `"Jugador:"`, `"Cubo:"` | Secuencias que detienen la generación |

### Ajustar según personalidad

Puedes crear variantes del modelo para cada personalidad:

```pwsh
# Modelo calmado (más determinista)
ollama create imacube-calm -f Modelfile.calm  # temperature 0.6

# Modelo caótico (más creativo)
ollama create imacube-chaotic -f Modelfile.chaotic  # temperature 1.0
```

Luego, desde el código, selecciona el modelo según la personalidad del cubo.

## Troubleshooting

### Error: "Ollama not running"
```pwsh
# Verifica que Ollama esté corriendo
ollama serve
```

### Error: "Model not found"
```pwsh
# Recrea el modelo
ollama create imacube -f Modelfile
```

### Respuestas genéricas o fuera de contexto
- Verifica que el system prompt se aplicó correctamente: `ollama show imacube`
- Ajusta `temperature` a un valor más bajo (0.6-0.7) para más coherencia
- Agrega más ejemplos few-shot en el `Modelfile`

### CORS errors desde el frontend
- Asegúrate de usar el proxy con `cors()` habilitado
- O configura OLLAMA para permitir CORS:
  ```pwsh
  $env:OLLAMA_ORIGINS="http://localhost:5173"
  ollama serve
  ```

## Recursos

- [Documentación de Ollama Modelfile](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)
- [Parámetros de generación](https://github.com/ollama/ollama/blob/main/docs/modelfile.md#parameter)
- [API de Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md)

## Siguientes Pasos

1. **Personalización por cubo**: Crear 5 variantes del modelo (calm, extrovert, curious, chaotic, neutral)
2. **Context injection**: Enviar estado del cubo (posición, libros leídos, emociones) en cada request
3. **Fine-tuning**: Entrenar con conversaciones reales para mejorar respuestas
4. **Multi-turn coherence**: Implementar memoria de largo plazo vía vector database
