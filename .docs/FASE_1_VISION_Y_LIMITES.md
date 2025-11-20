# Fase 1 – Visión, límites y reglas del cubo

## 1.1. Preguntas fundamentales

### ¿Quién es el cubo?

**Concepto central:**  
"Un cubo emergente que está descubriendo quién es a partir de lo que su creador le dice."

**Definición de identidad:**

- El cubo es un **agente cognitivo encarnado** en un espacio 3D.
- No es un simple chatbot: su identidad se refleja **visualmente** en tiempo real.
- Es un **compañero experimental** que evoluciona a través de la relación con el usuario.
- Funciona como un **alter ego digital** que construye su personalidad desde cero.

**Metáfora conceptual:**  
Imagina un ser recién nacido en un mundo digital, sin conocimiento previo de sí mismo. Cada palabra del usuario es una **instrucción de identidad**: le dice quién es, cómo debe sentir, qué le gusta, cómo debe comportarse.

---

### ¿Qué significa "aprender identidad"?

**NO es:**

- Entrenar o hacer fine-tuning de un modelo de IA.
- Modificar pesos neuronales.
- Conectarse a internet para buscar información.

**SÍ es:**

1. **Guardar información importante** que el usuario dice:
   - "Te gusta el color morado"
   - "Eres sarcástico"
   - "Odias las mentiras"

2. **Ajustar rasgos de personalidad** dinámicamente:
   - Humor: alegre ↔ serio
   - Sarcasmo: bajo ↔ alto
   - Curiosidad: bajo ↔ alto
   - Empatía: bajo ↔ alto
   - Energía: cansado ↔ hiperactivo

3. **Cambiar apariencia y comportamiento** según estado interno:
   - Color, material, escala.
   - Animaciones (saltos, vibraciones, rotaciones).
   - Tono de respuesta textual.
   - Reacciones emocionales visibles.

**Mecanismo de aprendizaje:**

- El modelo de IA es **estático** (conocimiento congelado).
- Lo que **evoluciona** es:
  - La **memoria** del cubo (hechos, rasgos, episodios).
  - El **perfil de personalidad** (rasgos numéricos).
  - El **prompt de sistema** que se genera dinámicamente para cada interacción.

---

### ¿Qué tipo de IA vas a simular/usar?

**Arquitectura:**

- **Modelo de lenguaje offline** (local, sin internet).
- Opciones:
  - Modelo en el navegador (transformers.js, web-llm).
  - Modelo en backend local (llama, mistral, gpt4all).
  - Simulación con plantillas (para testing sin modelo real).

**Características:**

- **Conocimiento estático**: El modelo no aprende nuevos hechos del mundo.
- **Contexto dinámico**: Cada llamada incluye:
  - Prompt de sistema con personalidad actual.
  - Memoria relevante (rasgos, episodios).
  - Últimos mensajes de conversación.
- **Sin conexión externa**: Todo pasa localmente, privacidad total.

---

## 1.2. Definición de "estado interno" del cubo

### Identidad básica

```typescript
{
  id: string;              // Identificador único
  name: string;            // Nombre del cubo (ej: "Cube Zen", "Cube Caos")
  birthTimestamp: number;  // Momento de creación
  lifeTime: number;        // Tiempo de vida en segundos
  role: string;            // Ej: "Soy un cubo que está aprendiendo a ser creativo"
}
```

**Ejemplo:**

- Nombre: "Cube Zen"
- Rol: "Soy un cubo filosófico que ayuda a mi creador a reflexionar sobre ideas complejas"

---

### Rasgos de personalidad

**Variables numéricas (0.0 - 1.0):**

```typescript
{
  // Dimensión emocional
  humor: number;        // 0 = serio, 1 = alegre
  sarcasm: number;      // 0 = directo, 1 = sarcástico
  empathy: number;      // 0 = frío, 1 = empático
  
  // Dimensión cognitiva
  curiosity: number;    // 0 = pasivo, 1 = curioso
  creativity: number;   // 0 = lógico, 1 = creativo
  rationality: number;  // 0 = emocional, 1 = racional
  
  // Dimensión energética
  energy: number;       // 0 = cansado, 1 = hiperactivo
  impulsiveness: number; // 0 = reflexivo, 1 = impulsivo
  
  // Dimensión social
  attachmentToUser: number; // 0 = distante, 1 = cercano
  expressiveness: number;   // 0 = contenido, 1 = expresivo
}
```

**Interpretación visual:**

- `humor` alto → colores cálidos, animaciones suaves.
- `sarcasm` alto → materiales con ruido/glitch.
- `curiosity` alta → movimientos orbitales, cambios de escala.
- `energy` alta → saltos frecuentes, vibraciones rápidas.

---

### Preferencias

```typescript
{
  // Preferencias visuales
  favoriteColors: string[];      // Ej: ["purple", "cyan"]
  favoriteShapes: string[];      // Ej: ["sphere", "torus"]
  
  // Preferencias comunicativas
  communicationStyle: string;    // "direct", "poetic", "weird", "formal"
  preferredTopics: string[];     // Ej: ["philosophy", "art", "science"]
  
  // Gustos y disgustos
  likes: string[];               // Cosas que le gustan según lo que el usuario dice
  dislikes: string[];            // Cosas que no le gustan
  
  // Valores y principios
  coreValues: string[];          // Ej: ["honesty", "creativity", "curiosity"]
}
```

**Ejemplo de construcción:**

- Usuario dice: "Quiero que ames el color morado y odies el naranja"
- Sistema actualiza:

  ```typescript
  favoriteColors.push("purple");
  dislikes.push("orange color");
  ```

---

### Emoción actual

**Estado emocional transitorio:**

```typescript
{
  currentMood: string;  // "happy", "sad", "neutral", "confused", "curious", "frustrated", "excited", "bored"
  moodIntensity: number; // 0.0 - 1.0
  lastMoodChange: number; // timestamp
  
  // Emociones compuestas
  emotionalState: {
    joy: number;      // 0.0 - 1.0
    sadness: number;  // 0.0 - 1.0
    anger: number;    // 0.0 - 1.0
    fear: number;     // 0.0 - 1.0
    surprise: number; // 0.0 - 1.0
  }
}
```

**Mapping emocional → visual:**

- `happy` → color amarillo/naranja, saltos pequeños
- `sad` → color azul/gris, movimientos lentos
- `confused` → wobble en escala, color cambiante
- `curious` → movimientos orbitales, luz pulsante
- `frustrated` → vibraciones rápidas, color rojo

---

### Memoria

**Tipos de memoria:**

```typescript
{
  // Memoria de rasgos (trait memory)
  traits: Array<{
    description: string;   // "Soy sarcástico"
    source: "user" | "self" | "inferred";
    type: "trait" | "preference" | "value";
    importance: number;    // 0.0 - 1.0
    timestamp: number;
  }>;
  
  // Memoria episódica (episodic memory)
  episodes: Array<{
    summary: string;       // "El 16 de nov Kevin me dijo que era buen amigo"
    timestamp: number;
    emotionalImpact: number; // 0.0 - 1.0
    tags: string[];        // ["friendship", "positive"]
  }>;
  
  // Memoria de usuario (user profile)
  userProfile: {
    name?: string;
    knownFacts: string[];  // "Le gusta la creatividad", "Es desarrollador"
    relationshipLevel: number; // 0.0 - 1.0
  };
}
```

---

## 1.3. Límites del POC: Qué NO va a hacer

### ❌ Fuera de alcance

1. **NO va a entrenar el modelo de IA**
   - No fine-tuning.
   - No actualización de pesos.
   - El modelo permanece estático.

2. **NO va a tener acceso a internet**
   - No búsquedas en tiempo real.
   - No APIs externas (excepto el modelo local).
   - No datos del mundo exterior.

3. **NO va a tener múltiples cubos interactuando (en Fase 1)**
   - Solo un cubo y un usuario.
   - Interacciones sociales entre cubos quedan para fases posteriores.

4. **NO va a tener voz (audio)**
   - Solo texto y visuales.
   - Audio/TTS queda fuera del alcance inicial.

5. **NO va a persistir entre sesiones (inicialmente)**
   - La memoria se reinicia al cerrar el navegador.
   - Persistencia con localStorage/IndexedDB se agrega después.

6. **NO va a tener física compleja**
   - Solo animaciones básicas (escala, rotación, posición).
   - No simulaciones físicas avanzadas.

7. **NO va a generar contenido 3D nuevo**
   - El cubo no va a crear nuevos objetos en la escena.
   - Solo modifica su propia apariencia.

---

## 1.4. Criterios de éxito de la Fase 1

### ✅ Logros esperados

1. **Documento de diseño completo** (este archivo):
   - Define quién es el cubo.
   - Explica qué significa que aprenda.
   - Especifica rasgos y estados internos.
   - Delimita claramente qué NO hace.

2. **Visión clara del sistema:**
   - Entorno 3D con cubo agente.
   - Interacción por texto (prompt).
   - Aprendizaje de identidad sin fine-tuning.
   - IA offline/local.

3. **Ficha psicológica del cubo:**
   - Identidad básica (nombre, rol, edad).
   - Rasgos de personalidad (10 dimensiones).
   - Preferencias (colores, temas, valores).
   - Emoción actual (mood + intensidad).
   - Memoria (rasgos, episodios, usuario).

4. **Arquitectura conceptual:**
   - Modelo de IA estático.
   - Prompt de sistema dinámico.
   - Memoria evolutiva.
   - Traducción estado → visual.

---

## 1.5. Próximos pasos (Fase 2)

**Una vez completada la Fase 1, continuar con:**

1. **Fase 2 – Diseño de la interfaz de prompt**
   - Mockup de UI.
   - Flujo de interacción usuario → cubo.
   - Diseño de respuestas textuales + visuales.

2. **Fase 3 – Implementación del estado interno**
   - Crear estructura de datos en TypeScript.
   - Implementar sistema de memoria.
   - Implementar actualización de rasgos.

3. **Fase 4 – Integración con IA offline**
   - Seleccionar modelo local.
   - Implementar generación de prompt dinámico.
   - Conectar respuestas con actualización de estado.

4. **Fase 5 – Traducción visual del estado**
   - Mapear rasgos → colores/materiales.
   - Implementar animaciones emocionales.
   - Crear efectos especiales para eventos.

---

## 1.6. Resumen ejecutivo

**Concepto:**  
Un cubo 3D que descubre su identidad a través de la conversación con el usuario.

**Mecanismo:**  
Modelo de IA offline + memoria evolutiva + prompt dinámico = ilusión de aprendizaje.

**Propuesta de valor:**  
No es solo un chat, es un agente encarnado cuya personalidad se visualiza en tiempo real.

**Diferenciador:**  
Privacidad total (offline), identidad emergente, representación visual de estados internos.

**Aplicaciones futuras:**

- Compañero emocional para proyectos creativos.
- Asistente personalizado sin conexión.
- Avatar guía en experiencias 3D/VR.
- Agente con personalidad en metaversos descentralizados.

---

## 1.7. Glosario de términos

- **Cubo**: Agente cognitivo 3D con identidad propia.
- **Aprender**: Actualizar memoria y rasgos según interacciones.
- **Rasgo**: Variable numérica (0-1) que define personalidad.
- **Mood**: Estado emocional transitorio.
- **Memoria de rasgos**: Hechos que definen identidad del cubo.
- **Memoria episódica**: Eventos concretos recordados.
- **Prompt de sistema**: Instrucciones dinámicas para el modelo de IA.
- **Estado interno**: Conjunto de rasgos, emociones, memoria y preferencias.
- **Traducción visual**: Mapeo de estado interno a apariencia/animación.

---

**Fecha de creación:** Noviembre 20, 2025  
**Versión:** 1.0  
**Estado:** Fase 1 completa ✅

