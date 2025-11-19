# Sistema de Cubo de Usuario vs. Cubos NPC

## Descripción General

El sistema ahora diferencia entre:
- **Cubo del Usuario** (`isUserCube: true`): El único cubo con el que el usuario puede interactuar directamente
- **Cubos NPC** (`isUserCube: false`): Cubos autónomos que pueblan el entorno y aprenden/navegan independientemente

## Arquitectura del Sistema

### 1. **Marcado de Cubos**

```typescript
interface CubeData {
  id: string;
  name?: string;
  personality?: Personality;
  eyeStyle?: EyeStyle;
  color?: string;
  auto?: boolean;
  isUserCube?: boolean; // ← Nuevo campo
  position?: [number, number, number];
}
```

### 2. **Creación de Cubo del Usuario**

En `addCubeToStorage()`:
```typescript
const cubeData: CubeData = {
  ...newCube,
  id,
  position: [x, y, z],
  auto: true,
  isUserCube: true, // ← Marcado como cubo interactivo del usuario
};
```

### 3. **Creación de NPCs**

Función `createNPCCubes()` crea 4 cubos autónomos:

```typescript
{
  id: "npc1",
  name: "Cube Zen",
  personality: "calm",
  eyeStyle: "bubble",
  color: "#808080",
  position: [-30, 8, -30],
  auto: true,
  isUserCube: false, // ← NPC autónomo
}
// + 3 más (Social, Curioso, Caos)
```

### 4. **Inicialización del Entorno**

Función `initializeEnvironment()`:
- Se llama después de que el usuario crea su primer cubo
- Verifica si ya existen NPCs
- Si no existen, agrega los 4 cubos NPC al entorno
- Guarda todo en localStorage

## Flujo de Trabajo

```
Usuario abre app (primera vez)
    ↓
Editor de cubo
    ↓
Usuario crea su cubo personalizado
    ↓
addCubeToStorage() → isUserCube: true
    ↓
initializeEnvironment()
    ↓
createNPCCubes() → 4 NPCs agregados
    ↓
saveCubesToStorage([userCube, ...npcCubes])
    ↓
Escena 3D renderiza 5 cubos:
    ├─ 1 cubo del usuario (interactivo)
    └─ 4 NPCs (autónomos, no seleccionables)
```

## Restricciones de Interacción

### 1. **Selección Restringida**

En `App.tsx`:
```typescript
const handleCubeSelect = useCallback((id: string) => {
  const cube = dynamicCubes.find(c => c.id === id);
  // Solo permite seleccionar cubo del usuario
  if (cube && cube.isUserCube) {
    setSelectedId(id);
  } else {
    // Deselecciona si hace clic en NPC
    setSelectedId(null);
  }
}, [dynamicCubes]);
```

**Resultado**:
- ✅ Click en cubo del usuario → se selecciona, muestra chat y footer
- ❌ Click en NPC → se deselecciona todo, solo se observa

### 2. **Tabs Filtrados**

En `CubeList.tsx`:
```typescript
// Solo muestra el cubo del usuario en los tabs
const userCubes = cubes.filter((cube) => cube.isUserCube);

return (
  <TabsContainer>
    {userCubes.map((cube) => ( ... ))}
  </TabsContainer>
);
```

**Resultado**:
- Footer solo muestra 1 tab (el cubo del usuario)
- NPCs no aparecen en la lista de tabs

### 3. **Footer Condicional**

En `CubeFooter.tsx`:
```typescript
// Solo muestra footer para cubo del usuario
if (!selectedCube || !selectedCube.isUserCube) {
  return null;
}
```

**Resultado**:
- Footer (tabs + ReactFlow graph) solo se muestra cuando el cubo del usuario está seleccionado
- Si se deselecciona o se intenta seleccionar NPC → footer desaparece

### 4. **Chat Panel**

En `CubeInteraction.tsx`:
```typescript
if (!cubeId) {
  return (
    <InteractionPanel>
      <EmptyState>Selecciona un cubo para interactuar</EmptyState>
    </InteractionPanel>
  );
}
```

**Resultado**:
- Chat solo funciona cuando `selectedId` apunta al cubo del usuario
- Click en NPC → `selectedId = null` → chat muestra mensaje vacío

## Comportamiento de NPCs

Los NPCs mantienen **total autonomía**:

✅ **Activos**:
- ✅ Navegación autónoma (saltos, exploración)
- ✅ Lectura de libros
- ✅ Aprendizaje de conceptos
- ✅ Cambio de personalidad por libros
- ✅ Interacción con espejos
- ✅ Reconocimiento social (entre NPCs)
- ✅ Anti-clumping (separación física)
- ✅ Animaciones (ojos, cejas, mood)

❌ **Inactivos**:
- ❌ Selección por usuario
- ❌ Conversación con usuario
- ❌ Mostrar en tabs del footer
- ❌ Mostrar knowledge graph

## Datos en LocalStorage

Ejemplo de estructura guardada:

```json
[
  {
    "id": "c1",
    "name": "Mi Cubo Especial",
    "personality": "calm",
    "eyeStyle": "bubble",
    "color": "#00bcd4",
    "position": [0, 5, 0],
    "auto": true,
    "isUserCube": true  ← Cubo del usuario
  },
  {
    "id": "npc1",
    "name": "Cube Zen",
    "personality": "calm",
    "eyeStyle": "bubble",
    "color": "#808080",
    "position": [-30, 8, -30],
    "auto": true,
    "isUserCube": false  ← NPC autónomo
  },
  {
    "id": "npc2",
    "name": "Cube Social",
    "personality": "extrovert",
    "eyeStyle": "dot",
    "color": "#ff9800",
    "position": [30, 7, -30],
    "auto": true,
    "isUserCube": false  ← NPC autónomo
  },
  // ... npc3, npc4
]
```

## Ventajas del Sistema

### 🎯 **UX Mejorado**
- Usuario tiene un cubo personal al que está "conectado"
- Evita confusión sobre qué cubos puede controlar
- Clara separación entre "mi cubo" y "el ecosistema"

### 🌍 **Ecosistema Vivo**
- 4 NPCs crean un ambiente dinámico
- Usuario observa cómo los NPCs aprenden y cambian
- Interacciones sociales entre NPCs (aunque usuario no controla)

### 💬 **Conversación Enfocada**
- Una única conversación activa (con el cubo del usuario)
- No hay confusión sobre con qué cubo se está hablando
- Historia de conversación coherente y personalizada

### 📊 **Performance**
- Solo 1 knowledge graph activo (del cubo del usuario)
- Menos carga en UI components
- Procesamiento de mensajes optimizado

## Testing

### Caso 1: Primera Carga
```
1. Abrir app
2. Ver editor
3. Crear cubo "MyCube" - calm - bubble - cyan
4. Verificar:
   ✓ 5 cubos en escena (1 user + 4 NPCs)
   ✓ Solo 1 tab en footer (MyCube)
   ✓ MyCube auto-seleccionado
   ✓ Chat activo con MyCube
```

### Caso 2: Interacción con NPCs
```
1. Click en NPC (ej: Cube Zen)
2. Verificar:
   ✓ Cubo no se selecciona
   ✓ Chat muestra "Selecciona un cubo para interactuar"
   ✓ Footer desaparece
   ✓ NPC continúa su comportamiento autónomo
```

### Caso 3: Reselección del Usuario
```
1. Click en cubo del usuario
2. Verificar:
   ✓ Cubo se selecciona
   ✓ Chat se activa
   ✓ Footer aparece
   ✓ Conversación previa se recupera
```

### Caso 4: Persistencia
```
1. Crear cubo
2. Cerrar navegador
3. Reabrir app
4. Verificar:
   ✓ 5 cubos presentes
   ✓ Cubo del usuario identificable
   ✓ NPCs en mismas posiciones
   ✓ isUserCube flags correctos
```

## Debugging

### Ver cubos en localStorage
```javascript
const cubes = JSON.parse(localStorage.getItem("creativedev.cubes"));
console.log("User cube:", cubes.find(c => c.isUserCube));
console.log("NPCs:", cubes.filter(c => !c.isUserCube));
```

### Contar cubos por tipo
```javascript
const cubes = JSON.parse(localStorage.getItem("creativedev.cubes"));
console.log("Total:", cubes.length);
console.log("User:", cubes.filter(c => c.isUserCube).length);
console.log("NPCs:", cubes.filter(c => !c.isUserCube).length);
```

### Reset completo
```javascript
localStorage.removeItem("creativedev.cubes");
location.reload();
```

## Posibles Extensiones Futuras

1. **Múltiples cubos de usuario**: Permitir crear más cubos interactivos
2. **Cambiar cubo activo**: Tabs permitirían cambiar entre cubos del usuario
3. **Configurar NPCs**: UI para agregar/remover NPCs
4. **NPC templates**: Diferentes sets de NPCs (científicos, artistas, etc.)
5. **Interacción indirecta**: NPCs pueden "escuchar" conversaciones del usuario
6. **Social dynamics**: NPCs pueden comentar sobre el cubo del usuario

## Conclusión

El sistema ahora proporciona:
- ✅ Un cubo personal y único para cada usuario
- ✅ Un ecosistema vivo de NPCs autónomos
- ✅ Interacción enfocada y sin confusión
- ✅ Observación pasiva del aprendizaje de NPCs
- ✅ Separación clara entre control e observación
