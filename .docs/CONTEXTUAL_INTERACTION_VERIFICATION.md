# Verificación: 8. Interacción Contextual

## Concepto Teórico

El cubo debe responder y comportarse **según su identidad y estado interno actual**, no solo según el mensaje individual del usuario. Ejemplos esperados:

- Sarcástico → Respuestas irónicas.
- Tímido → Frases cortas.
- Feliz → Animación más energética.
- Triste → Color frío y movimientos lentos.
- Contexto acumulado altera la respuesta futura.

## Estado Actual

| Aspecto | Implementado | Evidencia | Observaciones |
|---------|--------------|-----------|---------------|
| Respuestas ajustadas por personalidad base (calm, extrovert, curious, chaotic, neutral) | ✅ | `conversationThoughtTimeRef` + follow-ups | Personalidades base siguen siendo 5. |
| Sarcasmo (hint) influye en respuestas template | ✅ | `generateResponse` añade "Pff..." y tono | También en prompt OpenAI. |
| Timidez (shy) | ✅ (modificador) | `generateResponse` recorta longitud | No personalidad base; es modifier transitorio. |
| Respuestas más cortas (shy vs normal) | ✅ | Corte a ≤42 chars si shy | Extensible. |
| Animación más energética (feliz / funny) | ✅ | `pulseStrength` + jitterAmp por funny | Diferenciado por modifiers. |
| Color frío cuando triste | ✅ (visual) | Overlay azul + roughness | Aún sin ralentización física. |
| Movimiento/velocidad modulada por emoción | ❌ | No ajuste en fuerzas físicas | Pendiente. |
| Uso de `personalityHints` persistente | ✅ | `activeModifiers` en `PublicCubeState` | Sin expiración temporal todavía. |
| Jitter/confusión según pensamiento | ✅ | `jitterAmp` + confusion wobble | Mejorado con modifier funny. |
| Breath/respiración modulada por modifiers | ✅ | friendly/philosophical amplían breath | shy reduce breathAmp. |

## Evidencia Técnica

### 1. Base de Personalidad Modula Respuesta

Archivo: `src/ui/scene/components/Cube.tsx` (duración pensamiento)

```typescript
const personalityMultiplier: Record<Personality, number> = {
  calm: 1.5,
  curious: 1.2,
  extrovert: 0.8,
  chaotic: 0.6,
  neutral: 1.0,
};
conversationThoughtTimeRef.current = (baseTime + lengthFactor) * personalityMultiplier[currentPersonality];
```

Impacto: Extrovert y chaotic muestran pensamiento breve; calm retiene más tiempo.

### 2. Follow-Up Thoughts Personalizados

Archivo: `Cube.tsx`

```typescript
const followUpThoughts: Record<Personality, string[]> = {
  calm: ["Interesante...", "Hmm, déjame pensar..."],
  curious: ["¡Quiero saber más!", "¿Y si...?"],
  extrovert: ["¡Genial charla!", "¡Hablemos más!"],
  chaotic: ["Bueno, siguiente cosa...", "Listo, sigamos..."],
  neutral: ["Entendido.", "Anotado."],
};
```

Impacto: Genera continuidad contextual según personalidad base.

### 3. Emoción → Visual Overlay

Archivo: `visualState.ts`

```typescript
if (txt.includes("weee") || txt.includes("!")) { res.color = "#ffd166"; res.emissiveIntensity = ... }
else if (txt.includes("plof") || txt.includes("triste")) { res.color = "#7bb4ff"; res.roughness += 0.1; }
else if (txt.includes("hmm") || txt.includes("¿") || txt.includes("?")) { res.color = "#5df0a5"; res.jitterAmp = 0.015; }
```

Impacto: Estado emocional se refleja inmediatamente en color/textura/jitter.

### 4. Sarcasmo Detectado Como Hint (Solo OpenAI)

Archivo: `InteractionSystem.ts`

```typescript
if (/sarcástico|irónico/i.test(message)) personalityHints.push("sarcastic");
```

Archivo: `OpenAIService.ts`

```typescript
if (concepts?.personalityHints) contextParts.push(`[El usuario sugiere ser: ...]`);
```

Limitación: No existe adaptación local si OpenAI está desactivado.

### 5. Energía de Animación y Pulso

Archivo: `Cube.tsx` (reacción a mensaje)

```typescript
pulseStrength.current = Math.max(pulseStrength.current, 0.6);
```

Archivo: múltiples eventos (lectura, aprendizaje, arrival, book completion) elevan el `pulseStrength` hasta 1.2.

Impacto: Mayor energía visual durante estados positivos o eventos significativos.

### 6. Falta de Modulación de Velocidad por Tristeza

No hay código que reduzca `api.applyImpulse` o escala de movimiento cuando estado triste.

Búsqueda: `lento|slow|timid` → sin resultados.

## Gaps Detectados
 
| Gap | Descripción | Impacto | Estado | Próximo Paso |
|-----|-------------|---------|--------|-------------|
| Expiración de modifiers | activeModifiers no decaen con tiempo | Identidad puede "congelarse" | Pendiente | Añadir TTL y limpieza |
| Ralentización por tristeza | No afecta dinámica física | Menor realismo emocional | Pendiente | Escalar fuerza/jump cuando triste |
| Modulación física shy | Shy no reduce saltos/impulsos | Identidad parcial | Pendiente | Reducir amplitud de hop |
| Expresión visual específica sarcasmo | Solo emissive + jitter | Sutileza baja | Mejorable | Color edge magenta leve |
| Persistencia TTL en storage | Modifiers se guardan indefinidamente | Posible acumulación | Pendiente | Guardar timestamps y limpiar |

 
## Propuesta de Mejora (Incremental)
 
Ya aplicado parcialmente (modifiers, respuestas, overlays). Próximos pasos:

1. TTL para `activeModifiers` (e.g. 2–5 min) con limpieza automática.
2. Ajustes físicos (saltos más pequeños si triste/shy).
3. Overlays diferenciados para sarcasmo (borde magenta sutil) y serious (desaturación).
4. Follow-ups dinámicos también afectados por modifiers.
5. Persistir timestamps para poder reconstruir expiración tras reload.

 
 
## Veredicto Actual (Actualizado)
 
La interacción contextual pasó de parcial a **robusta en capa textual y visual**:

- ✅ Modifiers persistentes (`activeModifiers`) integrados en estado y respuesta template.
- ✅ Plantillas ahora reflejan sarcasmo, timidez, friendly, serious, funny, philosophical.
- ✅ Overlays visuales modifican color/emissive/breath/jitter según modifiers.
- ❌ Falta todavía modulación física y expiración temporal.

 
 
## Conclusión
 
La arquitectura ya soporta contextualidad por personalidad base y estado emocional del pensamiento. Para cumplir completamente la visión descrita (identidad dinámica extendida y modulación multimodal más rica) se requieren mejoras puntuales en almacenamiento y mapeo de `personalityHints` a comportamiento visible y motor.

**Estado de la verificación:** IMPLEMENTACIÓN EXTENDIDA (Textual + Visual) con pendientes físicos/TTL.

---
## Actualizaciones Recientes (2025-11-20)

### Implementado desde la última verificación

1. TTL en modifiers: Cada hint de personalidad se almacena como `ActiveModifier { name, expiresAt }` (3 min). Merge refresca expiración.
2. Limpieza periódica: `pruneExpiredModifiers()` llamado cada ~2s desde `Cube` elimina modifiers expirados sin generar renders excesivos.
3. Filtrado en actualización: `updateCube` descarta modifiers vencidos antes de notificar.
4. Modulación física emocional/contextual: Saltos y navegación reducen impulso si `shy`, `serious` o mood detectado `sad` (escala: shy 0.75, serious 0.9, sad 0.65).
5. Reubicación utilidades visuales: `lightenHex` y `tintHex` movidas arriba para evitar acceso antes de declaración.
6. Eliminación de `any`: Tipado explícito `ExplorationObject` para lista de exploración.
7. Lint & Sonar: Sin errores tras ajustes; advertencias resueltas.

### Evidencia de Código

Archivo: `src/ui/App.tsx` (merge y refresco TTL)

```ts
const TTL = 3 * 60 * 1000;
const map: Record<string, ActiveModifier> = {};
existing.forEach(m => { map[m.name] = m; });
hints.forEach(h => { map[h] = { name: h, expiresAt: now + TTL }; });
updateCube(selectedId, { activeModifiers: Object.values(map).filter(m => m.expiresAt > now) });
```

Archivo: `src/ui/scene/systems/Community.ts` (filtrado y pruning)

```ts
const filteredPrevMods = (cur.activeModifiers || []).filter(m => m.expiresAt > now);
// ...
export function pruneExpiredModifiers() {
  const freshMods = state.activeModifiers.filter(m => m.expiresAt > now);
}
```

Archivo: `src/ui/scene/components/Cube.tsx` (prune + modulación física)

```ts
if (t - lastPruneRef.current > 2) pruneExpiredModifiers();
let hopScale = 1;
if (modsNav.includes("shy")) hopScale *= 0.75;
if (modsNav.includes("serious")) hopScale *= 0.9;
if (mood === "sad") hopScale *= 0.65;
api.applyImpulse([dx, jumpStrength * hopScale, dz], [0,0,0]);
```

### Tabla Actualizada de Aspectos

| Aspecto | Implementado | Evidencia | Observaciones |
|---------|--------------|-----------|---------------|
| TTL de modifiers | ✅ | `App.tsx` + `Community.ts` | 3 min fijo (parametrizable) |
| Limpieza expiraciones | ✅ | `pruneExpiredModifiers()` | Llamado cada ~2s, costo bajo |
| Modulación salto según shy/sad/serious | ✅ | `Cube.tsx` hopScale | Afecta navegación y idle |
| Persistencia de modifiers con expiración | ✅ | Estado público, runtime | No guardados en storage aún |
| Desaturación serious | ✅ parcial | Menor breath/jitter | Falta reducción saturación material |
| Borde magenta sarcasmo | ❌ | No implementado | Pendiente (visual edge) |
| Follow-up afectado por modifiers | ❌ | Solo personalidad base | Extender lógica futura |
| Persistencia TTL tras reload | ❌ | TTL se pierde en recarga | Requiere guardado timestamps |

### Nuevos Gaps

| Gap | Impacto | Próximo Paso |
|-----|---------|-------------|
| Borde / outline sarcasmo | Menor claridad visual del modo | Agregar overlay edge magenta sutil |
| Saturación serious | Seriedad poco diferenciada | Reducir saturación color base/material |
| Follow-ups según modifiers | Menor riqueza contextual | Tabla frases por modifier activo |
| Persistencia TTL cross-reload | TTL se reinicia al recargar | Guardar `expiresAt` en storage y restaurar |

### Veredicto Revisado

La capa contextual ahora incluye identidad transitoria con expiración y efectos físicos; los pendientes se reducen a refinamientos visuales y persistencia prolongada. Interacción contextual: ESTADO → "Robusta + Física" con mejoras estéticas pendientes.

Última verificación: 2025-11-20
