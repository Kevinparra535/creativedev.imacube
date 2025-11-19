# Sistema de Editor de Cubos

## Descripción General

El sistema de editor de cubos permite a los usuarios crear sus propios cubos personalizados **la primera vez que abren la aplicación**. Los cubos creados se guardan en `localStorage` y persisten entre sesiones.

## Arquitectura del Sistema

### 1. **Detección de Primera Vez** (`cubeStorage.ts`)

```typescript
export function isFirstTimeUser(): boolean {
  const cubes = loadCubesFromStorage();
  return cubes.length === 0;
}
```

- Al cargar la app, verifica si hay cubos guardados en `localStorage`
- Si no hay cubos → muestra el editor
- Si hay cubos → carga los cubos guardados y muestra la escena 3D

### 2. **Almacenamiento LocalStorage**

**Storage Key**: `"creativedev.cubes"`

**Funciones principales**:
- `loadCubesFromStorage()`: Carga cubos guardados o retorna array vacío
- `saveCubesToStorage(cubes)`: Guarda configuración de cubos
- `addCubeToStorage(newCube)`: Agrega un nuevo cubo con ID y posición automática
- `clearCubesStorage()`: Limpia storage (útil para debugging/reset)

**Posicionamiento automático**:
```typescript
// Spiral pattern para evitar clumping
const angle = (index * Math.PI * 2) / 5;
const radius = 25;
const x = Math.cos(angle) * radius;
const z = Math.sin(angle) * radius;
const y = 5 + (index % 3) * 2; // Variar altura
```

### 3. **Componente CubeEditor**

**UI Elements**:
- ✏️ **Input de Nombre**: Texto personalizado (máx 30 caracteres)
- 🎨 **Paleta de Colores**: 10 colores predefinidos
- 👁️ **Selector de Ojos**: Bubble (redondos) o Dot (minimalistas)
- 🧠 **Selector de Personalidad**: 5 opciones con descripción

**Paleta de Colores**:
```typescript
[
  { name: "Gris Zen", value: "#808080" },
  { name: "Naranja Social", value: "#ff9800" },
  { name: "Cyan Curioso", value: "#00bcd4" },
  { name: "Rojo Caos", value: "#f44336" },
  { name: "Verde Neutro", value: "#4caf50" },
  { name: "Azul Profundo", value: "#2196f3" },
  { name: "Púrpura Místico", value: "#9c27b0" },
  { name: "Rosa Vibrante", value: "#e91e63" },
  { name: "Amarillo Brillante", value: "#ffeb3b" },
  { name: "Turquesa", value: "#1de9b6" },
]
```

**Personalidades**:
- **Calm (Zen)**: Filosófico, tranquilo, contemplativo
- **Extrovert (Social)**: Alegre, sociable, enérgico
- **Curious (Explorador)**: Inquisitivo, aventurero
- **Chaotic (Caos)**: Impredecible, salvaje, intenso
- **Neutral (Observador)**: Equilibrado, informativo

### 4. **Flujo de Creación**

```
Usuario abre app
    ↓
isFirstTimeUser() === true
    ↓
Muestra CubeEditor (modal overlay)
    ↓
Usuario personaliza cubo
    ↓
Click "✨ Crear Cubo"
    ↓
addCubeToStorage() → genera ID, posición
    ↓
Guarda en localStorage
    ↓
Actualiza dynamicCubes state
    ↓
Oculta editor
    ↓
Auto-selecciona nuevo cubo
    ↓
Renderiza escena 3D con cubo personalizado
```

### 5. **Integración con App.tsx**

```typescript
// Estado del editor
const [showEditor, setShowEditor] = useState(() => isFirstTimeUser());
const [dynamicCubes, setDynamicCubes] = useState<CubeData[]>(() => 
  loadCubesFromStorage()
);

// Handler de creación
const handleCreateCube = useCallback((cubeData) => {
  const newCube = addCubeToStorage(cubeData);
  setDynamicCubes((prev) => [...prev, newCube]);
  setShowEditor(false);
  setSelectedId(newCube.id); // Auto-select
}, []);

// Render condicional
{showEditor && <CubeEditor onCreateCube={handleCreateCube} />}
```

### 6. **Propagación del Color**

El color se propaga desde el editor hasta el material 3D:

```
CubeEditor
    ↓ (cubeData.color)
addCubeToStorage
    ↓ (newCube.color)
dynamicCubes state
    ↓ (cubes prop)
R3FCanvas
    ↓ (cube.color prop)
Cube component
    ↓
<meshStandardMaterial color={color || "#888888"} />
```

### 7. **Preview en Tiempo Real**

El editor muestra un preview animado del cubo:
- Rotación 3D continua (8s por vuelta)
- Muestra el emoji de ojos seleccionado
- Nombre y personalidad debajo
- Color aplicado al cubo

```tsx
<PreviewCube $color={color}>
  <div className="cube-face front">
    {eyeStyle === "bubble" ? "👁️" : "⚫"}
  </div>
  <div className="cube-name">{name || defaultName}</div>
  <div className="cube-personality">{personality}</div>
</PreviewCube>
```

## Estilos y Diseño

**Glassmorphism Modal**:
- Fondo: `rgba(30, 30, 40, 0.95)` con `backdrop-filter: blur(12px)`
- Overlay oscuro: `rgba(0, 0, 0, 0.85)`
- Animaciones: `fadeIn` (overlay) + `slideUp` (modal)

**Interacciones**:
- Color options: Hover scale(1.1), checkmark cuando seleccionado
- Eye styles: Hover translateY(-2px), border highlight
- Personalities: Hover translateX(4px), background transition
- Create button: Gradient purple, pulse animation on hover

## Campos de CubeData

```typescript
interface CubeData {
  id: string;                    // Auto-generado: "c1", "c2", etc.
  name?: string;                 // Nombre personalizado
  personality?: Personality;     // calm|extrovert|curious|chaotic|neutral
  eyeStyle?: EyeStyle;          // bubble|dot
  color?: string;                // Hex color: "#808080"
  auto?: boolean;                // true (comportamiento autónomo)
  position?: [number, number, number]; // Auto-generado en patrón espiral
}
```

## Casos de Uso

### Primera Carga
1. Usuario abre la app por primera vez
2. Ve modal de editor inmediatamente
3. Personaliza su primer cubo
4. Click "Crear Cubo" → escena 3D aparece
5. Cubo creado está seleccionado y visible

### Cargas Posteriores
1. Usuario abre la app
2. `loadCubesFromStorage()` carga cubos existentes
3. Editor NO se muestra
4. Escena 3D renderiza cubos guardados directamente

### Reset (Debugging)
```typescript
import { clearCubesStorage } from "./utils/cubeStorage";
clearCubesStorage(); // Limpia localStorage
// Recargar página → muestra editor nuevamente
```

## Limitaciones y Futuras Mejoras

**Limitaciones actuales**:
- Solo permite crear un cubo en primera carga
- No hay UI para agregar más cubos después
- No hay opción de editar cubos existentes
- No hay eliminación de cubos

**Mejoras futuras sugeridas**:
- ➕ Botón "Agregar Cubo" en UI principal
- ✏️ Modal de edición para cubos existentes
- 🗑️ Opción de eliminar cubos
- 📤 Exportar/importar configuración de cubos
- 🎨 Color picker personalizado (no solo presets)
- 🔧 Ajustes avanzados (tamaño, velocidad, comportamientos)

## Debugging

**Ver cubos guardados**:
```javascript
localStorage.getItem("creativedev.cubes")
```

**Verificar si es primera vez**:
```javascript
import { isFirstTimeUser } from "./utils/cubeStorage";
console.log(isFirstTimeUser()); // true o false
```

**Forzar reset**:
```javascript
localStorage.removeItem("creativedev.cubes");
location.reload();
```

## Performance

- localStorage es síncrono pero muy rápido para pequeños datos
- Parsing JSON solo ocurre una vez al cargar
- Estado local mantiene cubos en memoria (no re-parsea)
- Editor solo se renderiza cuando `showEditor === true`
- Preview cube usa CSS transforms (GPU-accelerated)

## Compatibilidad

✅ **Soportado**: Chrome, Firefox, Safari, Edge (todos navegadores modernos)
✅ **LocalStorage**: ~5-10MB disponible en todos los navegadores
✅ **React 19**: Compatible con nuevas reglas de purity
✅ **TypeScript**: Type-safe en toda la cadena de datos
