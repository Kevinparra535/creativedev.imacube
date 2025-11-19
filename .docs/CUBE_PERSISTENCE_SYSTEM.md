# Sistema de Persistencia Completa de Cubos

## ✅ Implementado

El sistema ahora guarda **TODO** el estado de los cubos en localStorage, permitiendo que al recargar la página los cubos mantengan:

---

## 📦 Datos Persistidos

### 1. **Configuración Estática** (guardado inmediatamente)
- `id` - Identificador único
- `name` - Nombre del cubo
- `personality` - Personalidad (calm, extrovert, curious, chaotic, neutral)
- `eyeStyle` - Estilo de ojos (bubble, dot)
- `color` - Color hexadecimal
- `isUserCube` - Si es el cubo del usuario o NPC
- `auto` - Si tiene comportamiento autónomo

### 2. **Estado Dinámico** (guardado cada 5 segundos + al salir)
- `position` - Posición actual [x, y, z]
- `capabilities` - Habilidades aprendidas:
  - `navigation` - Navegación aprendida (true/false)
  - `selfRighting` - Auto-enderezamiento (true/false)
- `learningProgress` - Progreso de aprendizaje:
  - `navigation` - 0.0 a 1.0
  - `selfRighting` - 0.0 a 1.0
- `knowledge` - Conocimiento por dominio:
  - `science`, `technology`, `math`, `theology`, `philosophy`
  - `literature`, `art`, `music`, `nature`, `self_awareness`
  - Cada uno con valor numérico (incrementa con libros leídos)
- `readingExperiences` - Experiencia de lectura:
  - `originalPersonality` - Personalidad original antes de cambios
  - `emotionsExperienced` - Array de emociones experimentadas
  - `traitsAcquired` - Rasgos adquiridos por aprendizaje
  - `booksRead` - Array de libros completados
  - `currentBook` - Libro actual siendo leído
  - `readingProgress` - Progreso del libro actual (0.0-1.0)
  - `conceptsLearned` - Conceptos aprendidos (ej: "Dios", "Fe")
- `socialTrait` - Rasgo social ("kind" o "selfish")

---

## 🔧 Arquitectura del Sistema

### Archivos Modificados/Creados

#### 1. `src/utils/cubeStorage.ts`
**Funciones añadidas:**
```typescript
// Guardar estados dinámicos
saveDynamicStates(states: PublicCubeState[]): void

// Cargar estados dinámicos
loadDynamicStates(): Record<string, PublicCubeState>

// Combinar configuración estática + estado dinámico
mergeCubeStates(cubes, dynamicStates): CubeData[]

// Limpiar TODO (configuración + estado dinámico)
clearCubesStorage(): void
```

**Keys de localStorage:**
- `creativedev.cubes` - Configuración estática (id, nombre, color, etc.)
- `creativedev.cubes.dynamicState` - Estados dinámicos (posición, conocimiento, etc.)

#### 2. `src/ui/hooks/useCubePersistence.ts` (NUEVO)
Hook personalizado que:
- Guarda automáticamente cada **5 segundos**
- Guarda al salir de la página (`beforeunload`)
- Guarda al desmontar el componente
- Expone `saveNow()` para guardado manual

```typescript
export function useCubePersistence() {
  // Auto-save every 5 seconds
  // Save on page unload
  // Return manual save function
}
```

#### 3. `src/ui/components/CubeList.tsx`
**Interfaz extendida:**
```typescript
export interface CubeData {
  // ... campos estáticos
  
  // Nuevos campos dinámicos
  capabilities?: {...}
  learningProgress?: {...}
  knowledge?: Record<string, number>
  readingExperiences?: {...}
  socialTrait?: "kind" | "selfish"
}
```

#### 4. `src/ui/App.tsx`
**Integración:**
```typescript
function App() {
  // Activa guardado automático
  useCubePersistence();
  
  // Carga cubos con estados dinámicos merged
  const [dynamicCubes, setDynamicCubes] = useState(() =>
    loadCubesFromStorage() // Ya incluye merge de estados
  );
  
  // Función de reset
  const handleReset = useCallback(() => {
    clearCubesStorage();
    window.location.reload();
  }, []);
}
```

#### 5. `src/ui/components/AIStatus.tsx`
**Botón de reset añadido:**
```typescript
<ResetButton onClick={handleReset}>
  🔄 Reiniciar Todo
</ResetButton>
```

Con diálogo de confirmación que advierte:
- Posiciones reiniciadas
- Conocimiento perdido
- Libros leídos borrados
- Emociones reiniciadas

---

## 🔄 Flujo de Persistencia

### Al Cargar la Página
```
1. loadCubesFromStorage()
   ↓
2. Load static config from "creativedev.cubes"
   ↓
3. Load dynamic states from "creativedev.cubes.dynamicState"
   ↓
4. mergeCubeStates() combina ambos
   ↓
5. Cubos renderizados con todo su estado restaurado
```

### Durante la Sesión
```
Cada 5 segundos:
1. listAll() obtiene todos los cubos del registry
   ↓
2. saveDynamicStates() guarda en localStorage
   ↓
3. Console log: "💾 Saved dynamic states for N cubes"

Al hacer cambios en Community registry:
1. updateCube() detecta cambios
   ↓
2. Notifica a listeners
   ↓
3. Próximo auto-save guardará cambios
```

### Al Salir
```
1. Evento "beforeunload" dispara
   ↓
2. saveDynamicStates() ejecuta guardado final
   ↓
3. Estados guardados antes de cerrar
```

---

## 🎮 Uso para el Usuario

### Escenario 1: Juego Normal
```
1. Crea su cubo
2. Los NPCs exploran, leen, aprenden
3. Usuario cierra la página
4. Al volver: TODO está como lo dejó
   - Cubos en sus posiciones actuales
   - Libros leídos recordados
   - Conocimientos preservados
   - Emociones experimentadas guardadas
```

### Escenario 2: Reiniciar
```
1. Usuario ve progreso en AIStatus panel
2. Click en "🔄 Reiniciar Todo"
3. Confirmación de seguridad
4. clearCubesStorage() limpia TODO
5. window.location.reload()
6. Vuelve al editor inicial (first-time user)
```

---

## 💾 Estructura de Datos en localStorage

### creativedev.cubes
```json
[
  {
    "id": "c1",
    "name": "Mi Cubo",
    "personality": "curious",
    "eyeStyle": "bubble",
    "color": "#00bcd4",
    "isUserCube": true,
    "position": [0, 5, 0],
    "auto": true
  },
  {
    "id": "npc1",
    "name": "Cube Zen",
    "personality": "calm",
    ...
  }
]
```

### creativedev.cubes.dynamicState
```json
{
  "c1": {
    "id": "c1",
    "position": [12.5, 3.2, -8.7],
    "personality": "curious",
    "socialTrait": "kind",
    "capabilities": {
      "navigation": true,
      "selfRighting": true
    },
    "learningProgress": {
      "navigation": 1.0,
      "selfRighting": 0.85
    },
    "knowledge": {
      "theology": 3,
      "philosophy": 2,
      "science": 1
    },
    "readingExperiences": {
      "originalPersonality": "curious",
      "emotionsExperienced": ["curious", "happy", "thoughtful"],
      "traitsAcquired": ["deep thinker", "spiritual"],
      "booksRead": ["La Biblia", "Física Cuántica"],
      "currentBook": "Arte Moderno",
      "readingProgress": 0.45,
      "conceptsLearned": ["Dios", "Fe", "Átomo", "Energía"]
    }
  },
  "npc1": { ... }
}
```

---

## 🔍 Debug y Logs

La consola muestra:
```
💾 Saved dynamic states for 5 cubes  // Cada 5 segundos
📂 Loaded dynamic states for 5 cubes // Al cargar página
```

Para inspeccionar en DevTools:
```javascript
// Ver configuración estática
JSON.parse(localStorage.getItem("creativedev.cubes"))

// Ver estados dinámicos
JSON.parse(localStorage.getItem("creativedev.cubes.dynamicState"))

// Limpiar todo
localStorage.removeItem("creativedev.cubes")
localStorage.removeItem("creativedev.cubes.dynamicState")
```

---

## ✨ Beneficios

1. ✅ **Continuidad total** - Los cubos "viven" entre sesiones
2. ✅ **Progreso preservado** - El aprendizaje no se pierde
3. ✅ **Personalidades evolucionadas** - Los cambios de personalidad persisten
4. ✅ **Historia completa** - Todos los libros leídos y conceptos se recuerdan
5. ✅ **Auto-save** - No requiere acción del usuario
6. ✅ **Reset fácil** - Un botón para empezar de cero

---

## 🚀 Próximos Pasos Posibles

- [ ] Exportar/importar estados (JSON download)
- [ ] Múltiples "saves" (diferentes mundos)
- [ ] Sincronización en nube (Firebase/Supabase)
- [ ] Histórico de cambios (timeline)
- [ ] Estadísticas globales (total de libros leídos, etc.)
