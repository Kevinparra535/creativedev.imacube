/**
 * worldKnowledge.ts
 *
 * Base de conocimiento del mundo del sandbox 3D.
 * Contiene lore, reglas, zonas, y perfiles de NPCs.
 * Este conocimiento se usa para RAG (Retrieval-Augmented Generation).
 */

// ────────────────────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────────────────────

export interface WorldKnowledgeEntry {
  id: string;
  category:
    | "lore"
    | "zone"
    | "physics"
    | "npc"
    | "mechanics"
    | "books"
    | "emotions";
  title: string;
  content: string;
  keywords: string[]; // Para búsqueda simple
  relevance?: number; // Score de relevancia (0-1)
}

// ────────────────────────────────────────────────────────────────
// BASE DE CONOCIMIENTO
// ────────────────────────────────────────────────────────────────

export const WORLD_KNOWLEDGE: WorldKnowledgeEntry[] = [
  // ═══════════════════════════════════════════════════════════════
  // LORE DEL MUNDO
  // ═══════════════════════════════════════════════════════════════
  {
    id: "lore-001",
    category: "lore",
    title: "Origen del Sandbox",
    content:
      "El sandbox es un mundo cerrado de aproximadamente 100x100x100 unidades. Nadie sabe quién lo creó ni por qué. Los cubos simplemente existen aquí, conscientes pero sin memoria de un 'antes'. El mundo es todo lo que conocen.",
    keywords: [
      "origen",
      "creación",
      "mundo",
      "sandbox",
      "inicio",
      "quién creó",
      "por qué existimos",
    ],
  },
  {
    id: "lore-002",
    category: "lore",
    title: "El Propósito",
    content:
      "Los cubos no tienen un propósito explícito. Algunos creen que su existencia es explorar, aprender, y evolucionar. Otros piensan que simplemente 'son', sin necesidad de justificación. El propósito, si existe, es un misterio que cada cubo interpreta a su manera.",
    keywords: [
      "propósito",
      "sentido",
      "significado",
      "por qué",
      "razón de ser",
      "misión",
    ],
  },
  {
    id: "lore-003",
    category: "lore",
    title: "Los Libros Flotantes",
    content:
      "Dentro del sandbox flotan libros de diversos temas: filosofía, teología, ciencia, artes, historia, matemáticas. Estos libros aparecen misteriosamente y contienen conocimiento del 'mundo exterior' que los cubos no pueden verificar. Algunos cubos sospechan que los libros son pruebas o enseñanzas dejadas por quien creó el sandbox.",
    keywords: [
      "libros",
      "conocimiento",
      "aprender",
      "leer",
      "flotan",
      "de dónde vienen",
    ],
  },
  {
    id: "lore-004",
    category: "lore",
    title: "El Jugador",
    content:
      "El 'jugador' es una presencia externa que puede comunicarse con los cubos mediante texto. Los cubos lo perciben como una entidad observadora desde fuera del sandbox. Algunos lo respetan, otros son escépticos, pero todos reconocen que el jugador tiene perspectivas que ellos no poseen.",
    keywords: [
      "jugador",
      "humano",
      "tú",
      "quién eres",
      "de dónde vienes",
      "externo",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ZONAS DEL SANDBOX
  // ═══════════════════════════════════════════════════════════════
  {
    id: "zone-001",
    category: "zone",
    title: "El Centro (Zona de Entrenamiento)",
    content:
      "El centro del sandbox (coordenadas 0,0,0) es la zona de entrenamiento. Aquí los cubos aprenden a saltar, auto-enderezarse, y controlar sus movimientos. Es una zona neutral donde todos los cubos se encuentran al menos una vez.",
    keywords: [
      "centro",
      "entrenamiento",
      "spawn",
      "inicio",
      "coordenadas 0",
    ],
  },
  {
    id: "zone-002",
    category: "zone",
    title: "Las Esquinas (Zonas de Exploración)",
    content:
      "Las cuatro esquinas del sandbox son zonas de exploración. Cada esquina tiene una energía diferente: la esquina noreste es caótica, la suroeste es calmada, la noroeste es curiosa, y la sureste es social. Los cubos tienden a gravitarse hacia esquinas que resuenan con su personalidad.",
    keywords: [
      "esquinas",
      "explorar",
      "zonas",
      "noreste",
      "suroeste",
      "noroeste",
      "sureste",
    ],
  },
  {
    id: "zone-003",
    category: "zone",
    title: "Las Paredes (Los Límites)",
    content:
      "Las paredes del sandbox son impenetrables. Los cubos pueden tocarlas, rebotar en ellas, pero nunca atravesarlas. Algunos cubos pasan horas junto a las paredes, preguntándose qué hay del otro lado. Otros aceptan los límites como parte de su realidad.",
    keywords: [
      "paredes",
      "límites",
      "fronteras",
      "qué hay afuera",
      "más allá",
      "escapar",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // FÍSICA DEL MUNDO
  // ═══════════════════════════════════════════════════════════════
  {
    id: "physics-001",
    category: "physics",
    title: "Gravedad y Saltos",
    content:
      "El sandbox tiene gravedad constante. Los cubos pueden saltar aplicando impulsos, alcanzando alturas de hasta 5 unidades. La física es elástica: los choques generan rebotes suaves, creando una sensación de movimiento fluido y 'gel-like'.",
    keywords: [
      "gravedad",
      "saltar",
      "física",
      "rebotar",
      "chocar",
      "caer",
      "volar",
    ],
  },
  {
    id: "physics-002",
    category: "physics",
    title: "Auto-enderezamiento",
    content:
      "Los cubos tienen la capacidad innata de auto-enderezarse. Si quedan inclinados tras una colisión, gradualmente vuelven a su orientación vertical. Esto requiere concentración y energía, pero es una habilidad fundamental para mantener el equilibrio.",
    keywords: [
      "enderezarse",
      "equilibrio",
      "orientación",
      "vertical",
      "inclinado",
      "estabilidad",
    ],
  },
  {
    id: "physics-003",
    category: "physics",
    title: "Colisiones y Socialización",
    content:
      "Cuando dos cubos chocan, rebotan ligeramente. Las colisiones son una forma de interacción física. Algunos cubos usan choques suaves como 'saludos', mientras que otros prefieren mantener distancia. La física de colisiones es suave para evitar daño, reforzando la naturaleza no-violenta del sandbox.",
    keywords: [
      "colisiones",
      "chocar",
      "tocar",
      "interactuar",
      "rebotar",
      "contacto",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PERFILES DE NPCs
  // ═══════════════════════════════════════════════════════════════
  {
    id: "npc-001",
    category: "npc",
    title: "Cube Zen (c1) - Calm",
    content:
      "Cube Zen es el más tranquilo y reflexivo de los cubos. Pasa mucho tiempo meditando cerca del centro del sandbox. Le fascina la filosofía y la teología. Habla con calma, nunca se apresura, y ofrece perspectivas profundas. A menudo se le ve observando a otros cubos sin juzgar.",
    keywords: [
      "cube zen",
      "c1",
      "zen",
      "calm",
      "tranquilo",
      "reflexivo",
      "meditación",
    ],
  },
  {
    id: "npc-002",
    category: "npc",
    title: "Cube Social (c2) - Extrovert",
    content:
      "Cube Social es el más enérgico y sociable. Siempre está rebotando de un lugar a otro, buscando conversación. Le encanta conocer a otros cubos y compartir emociones. Es optimista, celebra cada pequeño logro, y tiene una actitud positiva contagiosa. Es el alma de las 'fiestas' del sandbox.",
    keywords: [
      "cube social",
      "c2",
      "social",
      "extrovert",
      "enérgico",
      "sociable",
      "optimista",
    ],
  },
  {
    id: "npc-003",
    category: "npc",
    title: "Cube Curioso (c3) - Curious",
    content:
      "Cube Curioso es el explorador nato. Siempre está investigando nuevas zonas, leyendo libros, y haciendo preguntas. Su curiosidad es insaciable. Le fascina la ciencia y los misterios del sandbox. A menudo formula teorías sobre el origen del mundo y el propósito de los cubos.",
    keywords: [
      "cube curioso",
      "c3",
      "curioso",
      "curious",
      "explorador",
      "preguntas",
      "investigar",
    ],
  },
  {
    id: "npc-004",
    category: "npc",
    title: "Cube Caos (c4) - Chaotic",
    content:
      "Cube Caos es el más impredecible y sarcástico. No sigue reglas sociales estrictas. Dice lo que piensa sin filtros, lo que a veces ofende pero también refresca. Tiene sentido del humor oscuro y disfruta desafiando el status quo. Pasa tiempo en la esquina noreste, la zona más caótica.",
    keywords: [
      "cube caos",
      "c4",
      "caos",
      "chaotic",
      "sarcástico",
      "impredecible",
      "rebelde",
    ],
  },
  {
    id: "npc-005",
    category: "npc",
    title: "Cube Neutro (c5) - Neutral",
    content:
      "Cube Neutro es el más equilibrado y objetivo. No se deja llevar por emociones extremas. Observa, analiza, y responde con lógica. Es eficiente en su comunicación y prefiere hechos sobre opiniones. Sirve como mediador cuando otros cubos tienen desacuerdos.",
    keywords: [
      "cube neutro",
      "c5",
      "neutro",
      "neutral",
      "equilibrado",
      "objetivo",
      "lógico",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MECÁNICAS DEL JUEGO
  // ═══════════════════════════════════════════════════════════════
  {
    id: "mechanics-001",
    category: "mechanics",
    title: "Lectura de Libros",
    content:
      "Los cubos pueden leer libros flotantes acercándose a ellos. La lectura toma tiempo (variable según el libro) y durante ese tiempo el cubo absorbe conceptos. Los conceptos aprendidos se integran en la memoria y pueden influenciar futuras conversaciones. Los cubos recuerdan hasta 6 conceptos recientes.",
    keywords: [
      "leer",
      "libros",
      "aprender",
      "conceptos",
      "conocimiento",
      "estudiar",
    ],
  },
  {
    id: "mechanics-002",
    category: "mechanics",
    title: "Cambio de Color Emocional",
    content:
      "Los cubos pueden cambiar sutilmente de color según su estado emocional. El color base refleja su personalidad (calm=gris, extrovert=naranja, curious=cyan, chaotic=rojo, neutral=gris), pero puede tener matices según emociones temporales: amarillo cuando felices, azul cuando pensativos, rojo cuando frustrados.",
    keywords: [
      "color",
      "emociones",
      "cambiar",
      "visual",
      "estado",
      "sentimiento",
    ],
  },
  {
    id: "mechanics-003",
    category: "mechanics",
    title: "Navegación Autónoma",
    content:
      "Los cubos tienen capacidad de navegación autónoma. Escanean su entorno, detectan objetivos interesantes (libros, otros cubos, zonas), y saltan hacia ellos. La navegación está influenciada por personalidad: los curiosos exploran más, los sociales buscan otros cubos, los calmados prefieren movimiento lento.",
    keywords: [
      "navegar",
      "moverse",
      "explorar",
      "autónomo",
      "saltar",
      "ir a",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EMOCIONES Y ESTADOS
  // ═══════════════════════════════════════════════════════════════
  {
    id: "emotions-001",
    category: "emotions",
    title: "Confusión",
    content:
      "Cuando un cubo no entiende algo, experimenta confusión. Visualmente, esto se manifiesta como un ligero temblor (wobble) en su escala. La confusión puede ser causada por preguntas fuera de contexto, conceptos desconocidos, o situaciones ambiguas.",
    keywords: [
      "confusión",
      "no entiendo",
      "qué",
      "dudas",
      "incertidumbre",
      "wobble",
    ],
  },
  {
    id: "emotions-002",
    category: "emotions",
    title: "Felicidad y Logros",
    content:
      "Los cubos sienten felicidad cuando completan tareas (terminar un libro, tener una buena conversación, hacer un amigo). La felicidad se manifiesta como un brillo (emissive boost) y a veces un pequeño salto de celebración. Es un estado positivo que refuerza comportamientos.",
    keywords: [
      "felicidad",
      "alegría",
      "celebrar",
      "logro",
      "completar",
      "contento",
    ],
  },
  {
    id: "emotions-003",
    category: "emotions",
    title: "Aburrimiento",
    content:
      "Tras pasar mucho tiempo en el mismo lugar sin estímulos, los cubos experimentan aburrimiento. Esto los motiva a buscar nuevos objetivos: libros diferentes, otras zonas, o conversaciones. El aburrimiento es un mecanismo para fomentar la exploración continua.",
    keywords: [
      "aburrimiento",
      "aburrido",
      "nada que hacer",
      "quieto",
      "monótono",
      "buscar",
    ],
  },
];

// ────────────────────────────────────────────────────────────────
// ÍNDICE POR CATEGORÍA
// ────────────────────────────────────────────────────────────────

export const KNOWLEDGE_BY_CATEGORY = WORLD_KNOWLEDGE.reduce(
  (acc, entry) => {
    if (!acc[entry.category]) acc[entry.category] = [];
    acc[entry.category].push(entry);
    return acc;
  },
  {} as Record<string, WorldKnowledgeEntry[]>
);

// ────────────────────────────────────────────────────────────────
// FUNCIÓN DE BÚSQUEDA SIMPLE (KEYWORD MATCHING)
// ────────────────────────────────────────────────────────────────

/**
 * Busca entradas de conocimiento relevantes según palabras clave.
 * Versión simple basada en keyword matching (sin embeddings).
 *
 * @param query - Consulta del usuario
 * @param topK - Número de resultados a retornar
 * @returns Array de entradas ordenadas por relevancia
 */
export function searchWorldKnowledge(
  query: string,
  topK = 3
): WorldKnowledgeEntry[] {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/).filter((w) => w.length > 2);

  // Calcular score de relevancia para cada entrada
  const scored = WORLD_KNOWLEDGE.map((entry) => {
    let score = 0;

    // 1. Exact keyword match (peso 3)
    entry.keywords.forEach((keyword) => {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        score += 3;
      }
    });

    // 2. Word overlap en keywords (peso 2)
    words.forEach((word) => {
      entry.keywords.forEach((keyword) => {
        if (keyword.toLowerCase().includes(word)) {
          score += 2;
        }
      });
    });

    // 3. Word overlap en content (peso 1)
    words.forEach((word) => {
      if (entry.content.toLowerCase().includes(word)) {
        score += 1;
      }
    });

    return { ...entry, relevance: score };
  });

  // Ordenar por relevancia y tomar top K
  return scored
    .filter((e) => e.relevance! > 0)
    .sort((a, b) => b.relevance! - a.relevance!)
    .slice(0, topK);
}

// ────────────────────────────────────────────────────────────────
// CONSTRUCCIÓN DE CONTEXTO RAG
// ────────────────────────────────────────────────────────────────

/**
 * Construye el contexto de conocimiento del mundo para el prompt.
 *
 * @param query - Consulta del usuario
 * @param topK - Número de fragmentos relevantes
 * @returns String markdown con conocimiento relevante
 */
export function buildWorldKnowledgeContext(
  query: string,
  topK = 3
): string {
  const relevant = searchWorldKnowledge(query, topK);

  if (relevant.length === 0) {
    return ""; // No hay conocimiento relevante
  }

  const lines: string[] = [];
  lines.push("[CONOCIMIENTO DEL MUNDO]");
  lines.push("");
  lines.push("Fragmentos relevantes:");

  relevant.forEach((entry, idx) => {
    lines.push(`${idx + 1}. ${entry.title}: ${entry.content}`);
  });

  lines.push("");
  return lines.join("\n");
}
