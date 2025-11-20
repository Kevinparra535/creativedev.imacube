# Fase 2 – Sandbox 3D y flujo de interacción básico

## Objetivo

Diseñar mentalmente cómo se ve y se siente el entorno, y cómo el usuario interactúa con el cubo.

---

## 2.1. Elementos del mundo

### Escena 3D mínima

**Componentes visuales:**

1. **Plano (suelo)**
   - Superficie horizontal que define el espacio.
   - Material: grid pattern o color sólido con ligera reflexión.
   - Escala: suficientemente grande para que el cubo no parezca flotando en el vacío.
   - Función: anclar visualmente la escena y dar sensación de "lugar".

2. **El cubo protagonista**
   - Geometría: cubo de ~1-2 unidades de tamaño.
   - Material: dynamic (cambia según estado emocional/personalidad).
   - Posición inicial: centro de la escena, sobre el plano.
   - Pivot: centro del cubo para rotaciones y escalas simétricas.

3. **Cámara**
   - Tipo: orbital controls (OrbitControls).
   - Permite al usuario rotar, hacer zoom, pan.
   - Target: siempre apuntando al cubo.
   - Límites:
     - Min distance: 3 unidades (no atravesar el cubo).
     - Max distance: 15 unidades (no perderse en el espacio).
     - Polar angle: evitar que la cámara vaya debajo del plano.

4. **Iluminación**
   - **Ambient light**: luz base suave para que todo sea visible.
   - **Directional light**: luz principal que crea sombras y volumen.
   - **Point light opcional**: sobre el cubo cuando está "activo" (selected/thinking).
   - Color: neutral (blanco cálido) para no distorsionar los colores del cubo.

### Reglas del sandbox

**¿Hay gravedad o es un mundo más abstracto?**

- **Opción elegida: Mundo semi-abstracto con física ligera**
  - El cubo puede tener pequeños movimientos (saltos, rotaciones) pero no cae infinitamente.
  - No hay gravedad realista; los movimientos son artísticos/expresivos.
  - El cubo "vive" en el plano, no flota libremente.

**¿El cubo está fijo o puede moverse?**

- **El cubo puede moverse de forma expresiva:**
  - Pequeños saltos cuando está "feliz" o "excitado".
  - Vibraciones cuando está "nervioso" o "confundido".
  - Rotaciones suaves cuando está "pensando" o "curioso".
  - Movimientos no son controlados por el usuario, son autónomos según su estado.

**¿Hay otros objetos?**

- **Fase 2: NO**
  - Solo cubo + plano + luces.
  - Evita distracciones; el foco total es en la relación usuario ↔ cubo.
- **Futuro:**
  - Fase 3+: Podrían agregarse objetos decorativos, otros cubos, elementos interactivos.

---

## 2.2. Interacción usuario ↔ cubo

### Flujo conceptual completo

#### 1. Usuario entra al mundo

**Estado inicial:**

- Escena cargada con el cubo en estado `idle`.
- Cubo tiene color neutro (gris claro o color base de su personalidad).
- Animación sutil: respiración (scale pulse muy leve, 0.98 ↔ 1.02).
- UI de prompt está oculta o minimizada.

**Primera impresión:**

- El usuario ve el cubo desde una distancia media.
- Puede orbitar libremente para observar.
- No hay distracciones; la atención va directo al cubo.

#### 2. Usuario selecciona el cubo

**Métodos de selección:**

- **Click directo** sobre el cubo (raycasting).
- **Tecla de atajo** (ej: `E`, `Enter`, `Space`).
- **Proximidad** (opcional en Fase 3, si se agrega modo primera persona).

**Feedback visual inmediato:**

- **Outline/glow** alrededor del cubo.
- **Cambio de escala** sutil (+5% scale, efecto de "activación").
- **Point light** se enciende sobre el cubo.
- **Color shift** ligero hacia un tono más brillante.
- **Sonido** (opcional): pequeño "ping" o tono de confirmación.

**UI de prompt aparece:**

- Panel lateral (sidebar) o overlay central.
- Contiene:
  - **Input de texto** (textarea tipo chat).
  - **Botón de envío** (o Enter para enviar).
  - **Historial** de conversación (opcional en Fase 2, crítico en Fase 3).
  - **Indicador del nombre del cubo** y su mood actual (ej: "Cube Zen • Curious 😊").

#### 3. Usuario escribe algo

**Ejemplos de entrada:**

- "Quiero que seas un cubo muy curioso y juguetón"
- "¿Cómo te sientes hoy?"
- "Tu color favorito es el morado"
- "Háblame sobre filosofía"

**Mientras escribe:**

- El cubo permanece en estado `selected`.
- Animación sutil de anticipación (leve rotación en Y axis).

**Al presionar Enter/enviar:**

- El texto se envía al sistema.
- El cubo cambia a estado `thinking`.

#### 4. El sistema procesa

**Backend del flujo:**

```
Usuario input 
  → Construcción de contexto (personalidad + memoria + prompt)
  → Llamada al modelo de IA
  → Generación de respuesta (texto + cambios de estado)
  → Actualización de memoria/rasgos
  → Traducción de estado → visual
  → Mostrar respuesta
```

**Duración estimada:**

- 1-3 segundos (dependiendo del modelo y hardware).
- Durante este tiempo, el cubo está en estado `thinking`.

#### 5. El cubo responde

**Plano textual:**

- **Respuesta en texto** aparece en:
  - Burbuja de diálogo sobre el cubo (3D HTML overlay).
  - Panel de chat (historial de conversación).
- **Tono coherente** con personalidad actual:
  - Sarcástico: "Oh, claro, porque necesito MÁS cosas de qué preocuparme..."
  - Curioso: "¡Qué interesante! ¿Por qué piensas eso? 🤔"
  - Calmado: "Entiendo. Tomaré nota de eso."

**Plano visual:**

- **Cambio de color** (si el input afectó preferencias).
- **Animación emocional**:
  - Feliz → pequeños saltos.
  - Triste → baja ligera en posición Y.
  - Confundido → wobble en escala.
  - Curioso → rotaciones suaves.
- **Emissive glow** si está "emocionado" o "energético".
- **Particle effects** (opcional) para eventos especiales:
  - Aprendizaje importante → sparkles.
  - Cambio de personalidad → color wave.

#### 6. Cooldown y vuelta a idle

**Después de responder:**

- El cubo entra en estado `reacting` por ~2 segundos.
- Luego regresa a `idle` (si el usuario no interactúa).
- O permanece en `selected` si el usuario sigue con el prompt abierto.

**Cooldown entre interacciones:**

- Opcional: 1-2 segundos antes de permitir otro input.
- Evita spam y da sensación de "reflexión".

---

## 2.3. Estados de interacción

### Máquina de estados del cubo

```
   idle ←→ selected ←→ thinking → reacting → idle
     ↑                                ↓
     └────────────────────────────────┘
```

### Definición de cada estado

#### 1. **idle** (esperando interacción)

**Visual:**

- Color: base de personalidad o neutro.
- Escala: 1.0 (sin modificaciones).
- Animación: respiración sutil (scale pulse 0.98 ↔ 1.02, 2s loop).
- Rotación: muy lenta en Y axis (0.1 rad/s).
- Luz: solo ambient + directional (no point light).

**Comportamiento:**

- No responde a inputs de texto.
- Solo puede transicionar a `selected` mediante click/tecla.

**Duración:**

- Indefinida hasta que el usuario interactúe.

---

#### 2. **selected** (enfocado por el usuario)

**Visual:**

- Color: +10% brightness.
- Escala: 1.05 (ligeramente más grande).
- Animación: suave pulsación (scale 1.03 ↔ 1.07, 1.5s loop).
- Outline: glow azul/blanco alrededor del cubo.
- Point light: encendida (intensity: 0.5, color: según mood).

**Comportamiento:**

- UI de prompt visible y activa.
- Espera input del usuario.
- Puede transicionar a:
  - `thinking` si el usuario envía mensaje.
  - `idle` si el usuario deselecciona (ESC, click fuera).

**Duración:**

- Mientras el usuario tenga el prompt abierto.

---

#### 3. **thinking** (procesando input)

**Visual:**

- Color: shift hacia tono "analítico" (azul/cyan suave).
- Escala: oscilación rápida (0.98 ↔ 1.02, 0.5s loop).
- Animación: rotación en múltiples ejes (simula "procesamiento").
- Partículas: pequeños puntos orbitando el cubo (opcional).
- Point light: pulsante rápida (intensity 0.3 ↔ 0.8).

**Comportamiento:**

- No acepta nuevos inputs.
- Muestra indicador de "pensando..." en UI.
- Duración: 1-3 segundos (hasta que el modelo responda).

**Transición:**

- Automáticamente a `reacting` cuando la respuesta está lista.

---

#### 4. **reacting** (mostrando respuesta)

**Visual:**

- Color: según emoción de la respuesta:
  - Feliz → amarillo/naranja.
  - Triste → azul oscuro.
  - Enojado → rojo.
  - Neutral → vuelve a base.
- Escala: animación según emoción:
  - Feliz → saltos (Y position +0.5).
  - Triste → baja (Y position -0.2).
  - Confundido → wobble (scale X/Z).
- Rotación: puede girar para "mirar" a la cámara.
- Emissive: glow según intensidad emocional.

**Comportamiento:**

- Muestra la respuesta textual en UI.
- Ejecuta animaciones emocionales.
- Duración: 2-4 segundos (depende de la animación).

**Transición:**

- A `selected` si el prompt sigue abierto.
- A `idle` si el usuario cierra el prompt.

---

#### 5. **cooldown** (intervalo entre interacciones) [OPCIONAL]

**Visual:**

- Color: gradualmente vuelve a base.
- Escala: gradualmente vuelve a 1.0.
- Animación: transición suave desde `reacting` a `idle`.

**Comportamiento:**

- Previene inputs por 1-2 segundos.
- Da sensación de "respirar" entre pensamientos.

**Duración:**

- 1-2 segundos fijos.

---

## 2.4. Storyboard del flujo

### Secuencia visual paso a paso

```
┌─────────────────────────────────────────────────────────┐
│ PASO 1: Usuario entra                                  │
│                                                         │
│  [Escena]                    [UI]                       │
│   ┌───┐                      • Sin prompt              │
│   │ ▢ │ ← Cubo idle          • Sin historial           │
│   └───┘                                                 │
│  (respiración sutil)                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PASO 2: Usuario hace click en el cubo                  │
│                                                         │
│  [Escena]                    [UI]                       │
│   ┌───┐                      ┌─────────────────┐       │
│   │ ▣ │ ← Cubo selected      │ Cube Zen • 😊  │       │
│   └───┘                      │ ─────────────── │       │
│  (glow + scale 1.05)         │ [___________]  │       │
│                              │ [ Enviar ]     │       │
│                              └─────────────────┘       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PASO 3: Usuario escribe y envía                        │
│                                                         │
│  [Escena]                    [UI]                       │
│   ┌───┐                      ┌─────────────────┐       │
│   │ ◈ │ ← Cubo thinking      │ User: "Sé más  │       │
│   └───┘                      │ curioso"        │       │
│  (rotación + pulsación)      │                 │       │
│                              │ • Pensando...   │       │
│                              └─────────────────┘       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PASO 4: Cubo responde                                  │
│                                                         │
│  [Escena]                    [UI]                       │
│   ┌───┐                      ┌─────────────────┐       │
│   │ ▣ │ ← Cubo reacting      │ Cube: "¡Qué    │       │
│   └─┬─┘                      │ interesante!   │       │
│     │ (salto + color cyan)   │ Ahora soy más  │       │
│     ↓                        │ curioso 🤔"    │       │
│    "¡Qué interesante!"       └─────────────────┘       │
│  (burbuja 3D)                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PASO 5: Vuelta a idle (si el usuario cierra)           │
│                                                         │
│  [Escena]                    [UI]                       │
│   ┌───┐                      • Prompt cerrado          │
│   │ ▢ │ ← Cubo idle          • Cambios guardados:      │
│   └───┘                        - curiosity: 0.4 → 0.7  │
│  (color ligeramente cyan)      - color: neutro → cyan  │
└─────────────────────────────────────────────────────────┘
```

---

## 2.5. Mapa de estados visuales

### Matriz de estados × propiedades visuales

| Estado      | Color               | Escala | Animación           | Luz Point | Outline | Partículas |
|-------------|---------------------|--------|---------------------|-----------|---------|------------|
| **idle**    | Base/Neutro         | 1.0    | Respiración lenta   | Off       | Off     | Off        |
| **selected**| Base +10% brightness| 1.05   | Pulsación media     | On (0.5)  | On      | Off        |
| **thinking**| Cyan analítico      | 0.98↔1.02| Rotación rápida  | Pulsante  | On      | Opcional   |
| **reacting**| Según emoción       | Variable| Según emoción      | Variable  | On      | Opcional   |
| **cooldown**| Transición a base   | →1.0   | Easing suave        | →Off      | →Off    | Off        |

### Emociones × visuales (durante `reacting`)

| Emoción      | Color          | Animación          | Escala         | Emissive |
|--------------|----------------|--------------------|----------------|----------|
| **happy**    | Amarillo/Naranja| Saltos (Y +0.5)   | 1.0            | 0.3      |
| **sad**      | Azul oscuro    | Baja (Y -0.2)      | 0.95           | 0.0      |
| **confused** | Verde/Cyan     | Wobble (X/Z)       | 0.97↔1.03      | 0.1      |
| **curious**  | Cyan brillante | Rotación suave     | 1.05           | 0.4      |
| **frustrated**| Rojo          | Vibración rápida   | 0.98↔1.02      | 0.5      |
| **excited**  | Magenta        | Saltos + rotación  | 1.1            | 0.6      |
| **neutral**  | Base           | Respiración        | 1.0            | 0.0      |

---

## 2.6. Elementos de UI

### Panel de prompt (cuando cubo está `selected`)

**Componentes:**

1. **Header**
   - Nombre del cubo (ej: "Cube Zen")
   - Mood actual con emoji (ej: "Curious 😊")
   - Botón de cerrar (X)

2. **Historial de conversación** (scrollable)
   - Mensajes del usuario (align: right, color: azul)
   - Respuestas del cubo (align: left, color: según personalidad)
   - Timestamps opcionales

3. **Input de texto**
   - Textarea multiline
   - Placeholder: "Escribe algo..."
   - Límite de caracteres: 500 (evitar prompts infinitos)

4. **Botón de envío**
   - Label: "Enviar" o ícono de → 
   - Atajo: Enter (Shift+Enter para nueva línea)
   - Disabled mientras está en estado `thinking`

5. **Indicador de estado**
   - "Pensando..." con spinner cuando `thinking`
   - "Escribiendo..." si quieres simular typing effect

### Burbuja de diálogo 3D (opcional)

- **Posición**: Sobre el cubo (Y +2 unidades)
- **Contenido**: Última respuesta del cubo
- **Diseño**: Estilo cómic/cartoon con tail apuntando al cubo
- **Fade**: Desaparece después de 5-7 segundos
- **Animación**: Bounce in al aparecer, fade out al desaparecer

---

## 2.7. Criterios de éxito de la Fase 2

### ✅ Checklist de completitud

- [x] **Storyboard mental completo** del flujo de interacción
- [x] **Elementos del mundo** definidos:
  - [x] Plano (suelo)
  - [x] Cubo protagonista
  - [x] Cámara orbital
  - [x] Sistema de iluminación
- [x] **Reglas del sandbox** establecidas:
  - [x] Mundo semi-abstracto (física ligera)
  - [x] Cubo con movimientos expresivos autónomos
  - [x] Sin otros objetos (Fase 2)
- [x] **Estados de interacción** mapeados:
  - [x] idle
  - [x] selected
  - [x] thinking
  - [x] reacting
  - [x] cooldown (opcional)
- [x] **Transiciones entre estados** claras
- [x] **Visuales específicos por estado**:
  - [x] Color
  - [x] Escala
  - [x] Animaciones
  - [x] Luz
  - [x] Outline
- [x] **UI de prompt** diseñada conceptualmente
- [x] **Feedback visual inmediato** en cada acción del usuario

---

## 2.8. Próximos pasos (Fase 3)

**Una vez completada la Fase 2, continuar con:**

1. **Fase 3 – Prototipo técnico del sandbox**
   - Implementar escena básica en Three.js / R3F
   - Configurar cámara, luces, plano
   - Crear el cubo con material dinámico
   - Implementar estados visuales (idle, selected)

2. **Fase 4 – Sistema de selección e interacción**
   - Raycasting para detectar clicks
   - Máquina de estados para el cubo
   - UI de prompt funcional (sin IA aún)
   - Animaciones de transición entre estados

3. **Fase 5 – Integración con sistema de identidad**
   - Conectar input del usuario con actualización de rasgos
   - Implementar traducción estado → visual
   - Mapear emociones a animaciones específicas

---

## 2.9. Notas de diseño adicionales

### Filosofía de interacción

**Principios:**

1. **Claridad inmediata**: El usuario siempre sabe en qué estado está el cubo
2. **Feedback continuo**: Cada acción del usuario tiene respuesta visual/textual
3. **No-intrusivo**: La UI no tapa al cubo ni distrae de la experiencia 3D
4. **Ritmo natural**: Cooldowns y animaciones crean un ritmo conversacional, no mecánico
5. **Expresividad**: El cubo es un ser con presencia, no un objeto inerte

### Atmósfera visual

**Estética objetivo:**

- **Minimalista pero cálido**: Evitar sobrecarga visual
- **Juguetón sin ser infantil**: Animaciones suaves, no caricaturescas
- **Científico pero accesible**: Colores limpios, formas geométricas puras
- **Íntimo**: La escena invita a concentrarse en la relación usuario ↔ cubo

### Referencias conceptuales

- **Tamagotchi**: Cuidado de un ser digital que evoluciona
- **Portal (companion cube)**: Apego emocional a un objeto geométrico
- **Her (película)**: Relación profunda con una IA sin cuerpo físico tradicional
- **Monument Valley**: Geometría limpia, interacción simple, sensación contemplativa

---

**Fecha de creación:** Noviembre 20, 2025  
**Versión:** 1.0  
**Estado:** Fase 2 completa ✅

