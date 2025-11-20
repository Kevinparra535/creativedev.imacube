# Verificación: 9. Interacción como puerta al aprendizaje futuro

## Objetivo
Evaluar si la interacción actual (mensajes del usuario + sistemas internos) constituye una base válida para extender hacia:
- Memoria a largo plazo
- Personalidad progresiva
- Modificación de identidad
- Ajustes paramétricos por IA offline

La hipótesis: "La interacción del usuario es el input que define quién será el cubo".

## Marco de Análisis
| Dimensión | Qué implica | Señales requeridas | Persistencia requerida |
|-----------|-------------|--------------------|------------------------|
| Memoria a largo plazo | Retener eventos y patrones más allá de sesión | Historial extendido, conceptos agregados, conteos | Almacenamiento incremental (localStorage / IndexedDB) |
| Personalidad progresiva | Cambios graduales y acumulativos | Lecturas, emociones, feedback usuario, rasgos | Registro de métricas y umbrales de conversión |
| Modificación de identidad | Reescritura de rasgos activos / baseline | Hints repetidos, libros clave, emociones dominantes | Tracking de frecuencia y decaimiento |
| Ajustes paramétricos offline | Ajustar pesos sin API externa | Vector de parámetros (curiosidad, empatía, velocidad) | Serialización y carga inicial |

## Evidencia Actual (Código)
| Aspecto | Estado | Evidencia | Comentario |
|---------|--------|----------|------------|
| Lectura produce cambios de personalidad | ✅ | `checkPersonalityChange()` en `BookReadingSystem.ts` | Probabilístico, dependiente del libro |
| Registro de conceptos aprendidos | ✅ | `conceptosLearned` en `readingExperiences` (Cube.tsx) | Set → convertido a array al persistir |
| Persistencia básica de estado dinámico | ✅ | `saveDynamicStates()` + `mergeCubeStates()` | No incluye expiración de modifiers tras reload |
| Modifiers transitorios con TTL | ✅ | `ActiveModifier.expiresAt` + `pruneExpiredModifiers()` | 3 min, limpieza runtime, no persistente |
| Conversación influye respuestas futuras (historial corto) | ✅ parcial | `OpenAIService` mantiene últimos 10 mensajes | Historial limitado, no semantic clustering |
| Emociones momentáneas influyen visuales | ✅ | Overlays en `computeVisualTargets()` | No se acumulan en memoria histórica |
| Social learning de capacidades | ✅ | `tryLearnFromNeighbors()` + `spontaneousDiscovery()` | Solo 2 capacidades (navigation/selfRighting) |
| Decaimiento / olvido | ❌ | No se reduce conocimiento ni rasgos | Riesgo de acumulación monótona |
| Métricas de interacción usuario-cubo | ❌ | No se registra intensidad/frecuencia | Sin base para reforzar evolución |
| Parametrización explícita (vector) | ❌ | No existe estructura de parámetros | Personalidad fija más modifiers |

## Cómo la Interacción Actual Abre Camino
1. Mensajes del usuario ya producen hints (`personalityHints`) → se pueden contabilizar para mutar baseline si superan umbral.
2. Libros generan `conceptosLearned` y potencial cambio de personalidad → se puede ampliar a rasgos cuantitativos.
3. Emociones procesadas por lectura (`processEmotions`) → log histórico permitiría modelos de estabilidad/animo.
4. Social learning demuestra mecanismo de dependencia en otros agentes → escalable a transmisión de rasgos.
5. Modifiers con TTL establecen patrón de estados transitorios → base para capa de estados efímeros + consolidación.

## Gaps Clave
| Gap | Impacto | Riesgo si no se aborda | Propuesta |
|-----|---------|------------------------|-----------|
| Historial largo de conversación | Sin memoria semántica | Respuestas repetitivas, no evolución | Almacenar resumen vectorial + tópicos vistos |
| Sin agregación de hints | Cambios abruptos solo por libros | Identidad poco moldeada por usuario | Contar hints y aplicar umbrales (ej. 5× "sarcastic" ⇒ baseline shift) |
| Conocimientos sin decaimiento | Crecimiento ilimitado | Saturación + no selección | Implementar decaimiento logarithmic / media móvil |
| Falta de métricas de engagement | No adaptación por frecuencia | Se ignora intensidad del vínculo | Registrar timestamps y densidad de interacción |
| Parametrización inexistente | Dificulta ajuste offline | Evolución difusa | Introducir `traitsVector` (curiosity, empathy, boldness, stability...) |
| No persistencia de TTL | Estados se reinician al recargar | Pérdida de continuidad narrativa | Guardar `expiresAt` y restaurar; al expirar -> consolidar | 
| Ausencia de consolidación | Modifiers se pierden tras TTL | No formación de rasgo estable | Regla de consolidación (p.ej. 3 repeticiones ⇒ trait permanente) |

## Roadmap Propuesto (Fases)
| Fase | Objetivo | Cambios Técnicos | Resultado |
|------|----------|------------------|-----------|
| 1 | Persistencia extendida | Guardar `activeModifiers` con `expiresAt` + historial conversación en resumen | Memoria básica trans-sesión |
| 2 | Vector de rasgos | Añadir `traitsVector` (0-1) y normalización en `PublicCubeState` | Parametrización explícita |
| 3 | Umbrales de consolidación | Contador de hints → incrementa rasgos; consolidar si > threshold | Personalidad progresiva cuantitativa |
| 4 | Decaimiento & refuerzo | Scheduler que reduce valores lentamente; interacción relevante refuerza | Dinámica estable vs olvido |
| 5 | Memoria semántica | Agrupar mensajes por tópicos (embedding offline o TF-IDF) | Conversación influye intereses futuros |
| 6 | IA offline paramétrica | Motor interno ajusta respuestas según `traitsVector` + estado | Eliminación dependencia cloud para adaptación |
| 7 | Identidad modificable | Cambios en baseline si suma ponderada rasgos supera perfiles | Evolución emergente |

## Diseño de Datos Futuro (Ejemplo)
```ts
interface CubeIdentityState {
  personalityBaseline: Personality; // calm | ...
  traitsVector: {
    curiosity: number; // 0..1
    empathy: number;
    sarcasm: number;
    seriousness: number;
    playfulness: number;
    introspection: number;
  };
  hintCounters: Record<string, number>; // e.g. sarcastic -> 4
  consolidatedTraits: Set<string>; // traits promoted from modifiers
  conversationTopics: Array<{ topic: string; weight: number; lastSeen: number }>;
  longTermConcepts: Set<string>; // stable learned concepts
}
```

## Recomendaciones Prioritarias
1. Crear `identityState.ts` con vector y contadores derivado de interacción.
2. Añadir hook de persistencia para identidad (localStorage + versión schema).
3. Extender `generateResponse` para ponderar frases iniciales por `traitsVector`.
4. Implementar pipeline de consolidación al expirar modifiers.
5. Agregar decaimiento nocturno (al iniciar sesión, reducir rasgos un % si no reforzados).
6. Registrar densidad de interacción (n mensajes / ventana 15 min) para ajustar velocidad de evolución.
7. Definir mapping de rasgos→parámetros motores (ej: curiosity aumenta frecuencia de scans; seriousness reduce jitter).

## Implementación Inicial Añadida (2025-11-20)

| Elemento | Estado | Archivo | Detalle |
|----------|--------|---------|---------|
| identityState.ts | ✅ | `src/ui/scene/systems/IdentityState.ts` | Crea `traitsVector`, `hintCounters`, consolidación básica |
| Persistencia local | ✅ | IdentityState guarda por cubeId | Schema version=1, prefix `creativedev.identity.` |
| Actualización por hints | ✅ | `App.tsx` post extracción de `personalityHints` | Llama `updateIdentityWithHints()` |
| Consolidación threshold | ✅ | Valor=5 repeticiones | Añade a `consolidatedTraits` |
| Influencia placeholder | ✅ | `computePersonalityInfluence()` | Retorna `dominantTrait` si >0.75 |
| Integración respuesta | ❌ | `generateResponse` aún no usa traitsVector | Pendiente fase 6 |
| Decaimiento rasgos | ❌ | No implementado | Próxima fase |
| Persistencia TTL modifiers | ❌ | No restauramos expiraciones tras reload | Planificada |
| Métricas de densidad interacción | ❌ | No tracking | Agregar contador ventana temporal |

## Próximos Siguientes Cortos

1. Añadir restauración TTL (guardar `activeModifiers` + expiraciones en dynamic state).
2. Crear `identityInfluence.ts` para mapear rasgos → parámetros físicos (scanInterval, hopScale, jitterAmp).
3. Incluir `traitsVector` en `generateResponse` (matriz de pesos por intención).

## Veredicto

La interacción actual SÍ constituye una base para aprendizaje futuro: existen ya mecanismos de adquisición (lectura, social learning), modificación (cambio de personalidad por libros), estados transitorios (modifiers TTL) y extracción de intención (hints). Faltan capas de consolidación, parametrización cuantitativa y memoria semántica para considerar una identidad evolutiva completa.

**Estado Global:** FUNDACIÓN ESTABLE (✅ base lista) con NECESIDAD DE CAPA DE CONSOLIDACIÓN Y PARAMETRIZACIÓN (🔧 pendiente).

Última verificación: 2025-11-20
