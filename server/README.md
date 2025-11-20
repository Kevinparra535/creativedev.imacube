# Server Backend - Ollama Proxy

Servidor proxy Express que conecta el frontend de `creativedev.imacube` con Ollama (LLM local).

## Propósito

Este servidor actúa como intermediario entre:
- **Frontend** (React app en `localhost:5173`)
- **Ollama** (LLM local en `localhost:11434`)

Beneficios del proxy:
- Maneja CORS automáticamente
- Permite agregar lógica adicional (rate limiting, logging, caching)
- Normaliza respuestas de Ollama para el frontend
- Oculta detalles de implementación de Ollama al cliente

## Arquitectura

```
Frontend (React)
    ↓ POST /api/chat
Server Proxy (Express :3001)
    ↓ POST /api/chat
Ollama (:11434)
    ↓ Response
Server Proxy
    ↓ Normalized JSON
Frontend
```

## Setup

### 1. Instalar dependencias

```pwsh
cd server
npm install
```

Instala:
- `express@5.1.0` - Framework web
- `cors@2.8.5` - Manejo de CORS

### 2. Instalar y configurar Ollama

```pwsh
# Descargar desde https://ollama.ai/download

# Verificar instalación
ollama --version

# Descargar modelo base
ollama pull llama3.1

# Crear modelo personalizado desde el Modelfile del proyecto
cd ..
ollama create imacube -f Modelfile

# Verificar que se creó
ollama list  # Deberías ver "imacube"
```

### 3. Iniciar Ollama

```pwsh
# Ollama generalmente se ejecuta automáticamente como servicio
# Si no, ejecuta:
ollama serve
```

Ollama correrá en `http://localhost:11434`.

### 4. Iniciar el servidor proxy

```pwsh
cd server
npm start
```

Servidor disponible en `http://localhost:3001`.

## API

### POST /api/chat

Envía mensajes al modelo de Ollama.

**Request:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "Eres un cubo inteligente..."
    },
    {
      "role": "user",
      "content": "Hola, ¿cómo estás?"
    }
  ],
  "model": "imacube"
}
```

**Response (éxito):**
```json
{
  "message": {
    "role": "assistant",
    "content": "¡Hey! Estoy rebotando por aquí, explorando. ¿Vienes a charlar?"
  },
  "done": true,
  "total_duration": 1234567890,
  "load_duration": 123456,
  "prompt_eval_count": 25,
  "eval_count": 15
}
```

**Response (error):**
```json
{
  "error": "Error from Ollama",
  "detail": "model 'imacube' not found"
}
```

## Estructura del Proyecto

```
server/
├── index.js          # Servidor Express principal
├── package.json      # Dependencias y scripts
├── Modelfile         # (Opcional) Copia del Modelfile para referencia
└── README.md         # Esta documentación
```

## Scripts

```pwsh
npm start    # Inicia el servidor (node index.js)
```

## Troubleshooting

### Error: "Cannot find module 'express'"

```pwsh
cd server
npm install
```

### Error: "ECONNREFUSED localhost:11434"

Ollama no está corriendo. Inicia el servicio:

```pwsh
ollama serve
```

### Error: "model 'imacube' not found"

Crea el modelo personalizado:

```pwsh
cd ..
ollama create imacube -f Modelfile
```

### CORS errors desde el frontend

El proxy ya maneja CORS con `cors()`. Verifica que:
1. El servidor esté corriendo en `:3001`
2. El frontend use `http://localhost:3001/api/chat` (no `:11434`)
3. El `.env` tenga `VITE_LOCAL_AI_URL=http://localhost:3001/api/chat`

### Respuestas vacías o genéricas

Verifica que el modelo `imacube` esté usando el `Modelfile` correcto:

```pwsh
ollama show imacube
```

Si el system prompt está vacío, recrea el modelo:

```pwsh
ollama rm imacube
ollama create imacube -f ../Modelfile
```

## Extensiones Futuras

### Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite por IP
});

app.use('/api/chat', limiter);
```

### Logging

```javascript
app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;
  console.log(`[${new Date().toISOString()}] Chat request - Model: ${model}`);
  // ... resto del código
});
```

### Caching

```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 min

app.post('/api/chat', async (req, res) => {
  const key = JSON.stringify(req.body);
  const cached = cache.get(key);
  if (cached) return res.json(cached);
  
  // ... llamada a Ollama
  cache.set(key, data);
  res.json(data);
});
```

### Streaming

Para respuestas en tiempo real:

```javascript
app.post('/api/chat', async (req, res) => {
  const { messages, model } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    res.write(`data: ${chunk}\n\n`);
  }

  res.end();
});
```

## Recursos

- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Express.js Docs](https://expressjs.com/)
- [CORS Middleware](https://github.com/expressjs/cors)

## Contacto

Kevin Parra Lopez - kevinparra535@gmail.com
