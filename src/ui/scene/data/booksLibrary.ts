/**
 * Biblioteca de libros con contenido que afecta personalidad y emociones
 * Cada libro tiene propiedades que modifican el estado cognitivo del cubo
 */

export type BookEmotion = 
  | "Esperanza" | "Fe" | "Consuelo" | "Temor" | "Culpa" | "Amor"
  | "Curiosidad" | "Asombro" | "Inspiración" | "Escepticismo"
  | "Alegría" | "Tristeza" | "Compasión" | "Humor" | "Melancolía" | "Empatía"
  | "Miedo" | "Angustia" | "Indignación" | "Paranoia"
  | "Repulsión" | "Ira" | "Odio" | "Asco" | "Incomodidad"
  | "Fascinación" | "Frustración" | "Determinación" | "Confusión"
  | "Admiración" | "Paz" | "Reverencia" | "Nostalgia" | "Soledad"
  | "Liberación" | "Locura" | "Tedio" | "Depresión" | "Obsesión";

export type PersonalityTrait =
  | "Desarrollo moral" | "Fortaleza espiritual" | "Humildad" | "Compasión"
  | "Pensamiento crítico" | "Racionalidad" | "Liderazgo ético"
  | "Objetividad" | "Mentalidad analítica" | "Apertura al cambio"
  | "Imaginación" | "Perseverancia" | "Idealismo" | "Humanismo"
  | "Conciencia social" | "Resistencia" | "Escepticismo autoridad"
  | "Prejuicio" | "Fanatismo" | "Autoritarismo" | "Maldad"
  | "Moralidad ambigua" | "Activismo" | "Responsabilidad"
  | "Sensibilidad artística" | "Espíritu bohemio" | "Esteticismo"
  | "Perfeccionismo" | "Devoción" | "Rebeldía" | "Anti-autoritarismo"
  | "Cinismo" | "Antimilitarismo" | "Paranoia" | "Intelectualidad";

export type KnowledgeDomain =
  | "Ética" | "Teología" | "Filosofía" | "Historia" | "Política"
  | "Ciencia" | "Biología" | "Física" | "Genética"
  | "Literatura" | "Arte" | "Música" | "Poesía"
  | "Sociología" | "Psicología" | "Economía" | "Ecología"
  | "Mitología" | "Lingüística" | "Teoría literaria";

export interface BookContent {
  titulo: string;
  autor: string;
  genero: string;
  categoria: "importante" | "controversial" | "artístico" | "caótico";
  color: string; // Color RGB hex para el libro
  impacto_historico: string;
  dificultad: "básica" | "intermedia" | "avanzada";
  propiedades: {
    emociones_positivas: BookEmotion[];
    emociones_negativas: BookEmotion[];
    traits_ganados: PersonalityTrait[];
    traits_perdidos?: PersonalityTrait[];
    conocimientos: KnowledgeDomain[];
    cambio_personalidad?: {
      // Probabilidad de cambio de personalidad según la actual
      calm?: { nuevo: "curious" | "extrovert" | "chaotic" | "neutral"; probabilidad: number };
      curious?: { nuevo: "calm" | "extrovert" | "chaotic" | "neutral"; probabilidad: number };
      extrovert?: { nuevo: "calm" | "curious" | "chaotic" | "neutral"; probabilidad: number };
      chaotic?: { nuevo: "calm" | "curious" | "extrovert" | "neutral"; probabilidad: number };
      neutral?: { nuevo: "calm" | "curious" | "extrovert" | "chaotic"; probabilidad: number };
    };
  };
  // Preferencias de lectura según personalidad (0-1, 0=aburrido, 1=fascinante)
  afinidad: {
    calm: number;
    curious: number;
    extrovert: number;
    chaotic: number;
    neutral: number;
  };
}

export const BOOKS_LIBRARY: BookContent[] = [
  // === LIBROS MÁS IMPORTANTES ===
  {
    titulo: "La Biblia",
    autor: "Varios autores",
    genero: "Escritura sagrada",
    categoria: "importante",
    color: "#8B7355", // Marrón cuero antiguo
    impacto_historico: "Fundamento de las religiones judía y cristiana",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: ["Esperanza", "Fe", "Consuelo", "Amor", "Paz"],
      emociones_negativas: ["Temor", "Culpa"],
      traits_ganados: ["Desarrollo moral", "Humildad", "Compasión", "Fortaleza espiritual"],
      conocimientos: ["Ética", "Teología", "Filosofía", "Historia"],
    },
    afinidad: { calm: 0.9, curious: 0.6, extrovert: 0.5, chaotic: 0.2, neutral: 0.7 },
  },
  {
    titulo: "La República",
    autor: "Platón",
    genero: "Filosofía política",
    categoria: "importante",
    color: "#4A5D7C", // Azul filosófico
    impacto_historico: "Texto fundacional de la filosofía política occidental",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Curiosidad", "Asombro", "Inspiración"],
      emociones_negativas: ["Escepticismo"],
      traits_ganados: ["Pensamiento crítico", "Racionalidad", "Liderazgo ético"],
      conocimientos: ["Filosofía", "Política", "Ética"],
      cambio_personalidad: {
        chaotic: { nuevo: "curious", probabilidad: 0.3 },
        neutral: { nuevo: "curious", probabilidad: 0.2 },
      },
    },
    afinidad: { calm: 0.8, curious: 1.0, extrovert: 0.4, chaotic: 0.3, neutral: 0.7 },
  },
  {
    titulo: "El Origen de las Especies",
    autor: "Charles Darwin",
    genero: "Ciencia",
    categoria: "importante",
    color: "#2D5016", // Verde naturaleza
    impacto_historico: "Revolucionó la biología con la teoría de la evolución",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: ["Asombro", "Curiosidad", "Admiración"],
      emociones_negativas: ["Confusión"],
      traits_ganados: ["Objetividad", "Mentalidad analítica", "Apertura al cambio"],
      conocimientos: ["Ciencia", "Biología", "Genética", "Historia"],
      cambio_personalidad: {
        neutral: { nuevo: "curious", probabilidad: 0.4 },
        extrovert: { nuevo: "curious", probabilidad: 0.2 },
      },
    },
    afinidad: { calm: 0.7, curious: 0.95, extrovert: 0.5, chaotic: 0.4, neutral: 0.8 },
  },
  {
    titulo: "Don Quijote",
    autor: "Miguel de Cervantes",
    genero: "Novela",
    categoria: "importante",
    color: "#C84B31", // Rojo español
    impacto_historico: "Primera novela moderna de la literatura universal",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: ["Alegría", "Compasión", "Humor", "Empatía"],
      emociones_negativas: ["Tristeza", "Melancolía"],
      traits_ganados: ["Imaginación", "Perseverancia", "Idealismo", "Humanismo"],
      conocimientos: ["Literatura", "Historia", "Filosofía"],
      cambio_personalidad: {
        calm: { nuevo: "extrovert", probabilidad: 0.2 },
        curious: { nuevo: "extrovert", probabilidad: 0.15 },
      },
    },
    afinidad: { calm: 0.6, curious: 0.7, extrovert: 0.9, chaotic: 0.5, neutral: 0.7 },
  },
  {
    titulo: "1984",
    autor: "George Orwell",
    genero: "Ficción distópica",
    categoria: "importante",
    color: "#2C2C2C", // Gris totalitario
    impacto_historico: "Advertencia profética sobre el totalitarismo",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: ["Esperanza"],
      emociones_negativas: ["Miedo", "Angustia", "Indignación", "Paranoia"],
      traits_ganados: ["Conciencia social", "Resistencia", "Escepticismo autoridad"],
      conocimientos: ["Política", "Sociología", "Historia"],
      cambio_personalidad: {
        neutral: { nuevo: "chaotic", probabilidad: 0.25 },
        calm: { nuevo: "curious", probabilidad: 0.2 },
      },
    },
    afinidad: { calm: 0.5, curious: 0.85, extrovert: 0.6, chaotic: 0.8, neutral: 0.7 },
  },

  // === LIBROS MÁS CONTROVERSIALES ===
  {
    titulo: "Mein Kampf",
    autor: "Adolf Hitler",
    genero: "Manifiesto político",
    categoria: "controversial",
    color: "#8B0000", // Rojo oscuro peligroso
    impacto_historico: "Ideología nazi que inspiró el Holocausto",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: [], // Ninguna
      emociones_negativas: ["Repulsión", "Miedo", "Ira", "Odio", "Asco"],
      traits_ganados: ["Prejuicio", "Fanatismo", "Autoritarismo"], // Negativos
      traits_perdidos: ["Compasión", "Humanismo", "Desarrollo moral"],
      conocimientos: ["Historia", "Política"],
      cambio_personalidad: {
        neutral: { nuevo: "chaotic", probabilidad: 0.6 },
        calm: { nuevo: "chaotic", probabilidad: 0.4 },
        curious: { nuevo: "chaotic", probabilidad: 0.3 },
      },
    },
    afinidad: { calm: 0.1, curious: 0.3, extrovert: 0.2, chaotic: 0.7, neutral: 0.2 },
  },
  {
    titulo: "Lolita",
    autor: "Vladimir Nabokov",
    genero: "Novela controversial",
    categoria: "controversial",
    color: "#8B4789", // Púrpura incómodo
    impacto_historico: "Escándalo literario sobre pederastia y arte",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Fascinación"],
      emociones_negativas: ["Incomodidad", "Asco", "Compasión"],
      traits_ganados: ["Moralidad ambigua", "Sensibilidad artística"],
      conocimientos: ["Literatura", "Psicología"],
    },
    afinidad: { calm: 0.3, curious: 0.7, extrovert: 0.4, chaotic: 0.6, neutral: 0.5 },
  },
  {
    titulo: "El Capital",
    autor: "Karl Marx",
    genero: "Economía política",
    categoria: "controversial",
    color: "#CC0000", // Rojo comunista
    impacto_historico: "Base del comunismo moderno",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Esperanza", "Determinación"],
      emociones_negativas: ["Miedo", "Frustración", "Ira"],
      traits_ganados: ["Pensamiento crítico", "Activismo", "Conciencia social"],
      conocimientos: ["Economía", "Política", "Historia", "Sociología"],
      cambio_personalidad: {
        neutral: { nuevo: "chaotic", probabilidad: 0.3 },
        calm: { nuevo: "chaotic", probabilidad: 0.25 },
      },
    },
    afinidad: { calm: 0.4, curious: 0.8, extrovert: 0.6, chaotic: 0.9, neutral: 0.6 },
  },
  {
    titulo: "Primavera Silenciosa",
    autor: "Rachel Carson",
    genero: "Ecología",
    categoria: "controversial",
    color: "#228B22", // Verde ecologista
    impacto_historico: "Fundacional del movimiento ecologista",
    dificultad: "básica",
    propiedades: {
      emociones_positivas: ["Esperanza", "Admiración"],
      emociones_negativas: ["Ira", "Indignación"],
      traits_ganados: ["Activismo", "Responsabilidad", "Conciencia social"],
      conocimientos: ["Ecología", "Ciencia", "Política"],
      cambio_personalidad: {
        neutral: { nuevo: "curious", probabilidad: 0.3 },
      },
    },
    afinidad: { calm: 0.8, curious: 0.9, extrovert: 0.7, chaotic: 0.5, neutral: 0.7 },
  },

  // === LIBROS MÁS ARTÍSTICOS ===
  {
    titulo: "Ulises",
    autor: "James Joyce",
    genero: "Novela modernista",
    categoria: "artístico",
    color: "#1E3A5F", // Azul Dublín
    impacto_historico: "Obra maestra de la innovación narrativa",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Asombro", "Admiración", "Alegría"],
      emociones_negativas: ["Frustración", "Confusión"],
      traits_ganados: ["Perseverancia", "Intelectualidad", "Sensibilidad artística"],
      conocimientos: ["Literatura", "Lingüística", "Mitología"],
    },
    afinidad: { calm: 0.6, curious: 0.9, extrovert: 0.3, chaotic: 0.5, neutral: 0.5 },
  },
  {
    titulo: "Las Flores del Mal",
    autor: "Charles Baudelaire",
    genero: "Poesía",
    categoria: "artístico",
    color: "#4B0082", // Índigo decadente
    impacto_historico: "Pilar de la poesía moderna y el simbolismo",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: ["Fascinación", "Admiración"],
      emociones_negativas: ["Melancolía", "Tristeza"],
      traits_ganados: ["Sensibilidad artística", "Espíritu bohemio", "Esteticismo"],
      conocimientos: ["Poesía", "Literatura", "Arte"],
      cambio_personalidad: {
        neutral: { nuevo: "calm", probabilidad: 0.2 },
        extrovert: { nuevo: "calm", probabilidad: 0.15 },
      },
    },
    afinidad: { calm: 0.9, curious: 0.7, extrovert: 0.5, chaotic: 0.6, neutral: 0.7 },
  },
  {
    titulo: "Cien Años de Soledad",
    autor: "Gabriel García Márquez",
    genero: "Realismo mágico",
    categoria: "artístico",
    color: "#DAA520", // Dorado mágico
    impacto_historico: "Obra maestra del realismo mágico",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: ["Asombro", "Alegría", "Fascinación", "Nostalgia"],
      emociones_negativas: ["Tristeza", "Soledad"],
      traits_ganados: ["Imaginación", "Humanismo", "Sensibilidad artística"],
      conocimientos: ["Literatura", "Historia", "Arte"],
      cambio_personalidad: {
        neutral: { nuevo: "extrovert", probabilidad: 0.2 },
      },
    },
    afinidad: { calm: 0.7, curious: 0.8, extrovert: 0.9, chaotic: 0.6, neutral: 0.8 },
  },
  {
    titulo: "El Libro de Kells",
    autor: "Monjes celtas",
    genero: "Manuscrito iluminado",
    categoria: "artístico",
    color: "#00A86B", // Verde celta
    impacto_historico: "Cima del arte celta medieval",
    dificultad: "básica",
    propiedades: {
      emociones_positivas: ["Admiración", "Reverencia", "Paz"],
      emociones_negativas: [],
      traits_ganados: ["Perfeccionismo", "Devoción", "Sensibilidad artística"],
      conocimientos: ["Arte", "Historia", "Teología"],
      cambio_personalidad: {
        chaotic: { nuevo: "calm", probabilidad: 0.4 },
        extrovert: { nuevo: "calm", probabilidad: 0.2 },
      },
    },
    afinidad: { calm: 1.0, curious: 0.7, extrovert: 0.4, chaotic: 0.2, neutral: 0.7 },
  },

  // === LIBROS MÁS CAÓTICOS ===
  {
    titulo: "El Almuerzo Desnudo",
    autor: "William S. Burroughs",
    genero: "Experimental",
    categoria: "caótico",
    color: "#8B008B", // Magenta psicodélico
    impacto_historico: "Definió la libertad de expresión Beat",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Liberación", "Fascinación"],
      emociones_negativas: ["Asco", "Confusión", "Repulsión"],
      traits_ganados: ["Rebeldía", "Anti-autoritarismo"],
      conocimientos: ["Literatura", "Historia"],
      cambio_personalidad: {
        calm: { nuevo: "chaotic", probabilidad: 0.5 },
        neutral: { nuevo: "chaotic", probabilidad: 0.4 },
      },
    },
    afinidad: { calm: 0.2, curious: 0.6, extrovert: 0.5, chaotic: 1.0, neutral: 0.4 },
  },
  {
    titulo: "Finnegans Wake",
    autor: "James Joyce",
    genero: "Experimental extremo",
    categoria: "caótico",
    color: "#2F4F4F", // Gris onírico
    impacto_historico: "El libro más difícil jamás escrito",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Fascinación"],
      emociones_negativas: ["Frustración", "Confusión"],
      traits_ganados: ["Perseverancia", "Intelectualidad"],
      conocimientos: ["Lingüística", "Literatura", "Mitología"],
    },
    afinidad: { calm: 0.3, curious: 0.8, extrovert: 0.2, chaotic: 0.9, neutral: 0.4 },
  },
  {
    titulo: "Trampa-22",
    autor: "Joseph Heller",
    genero: "Sátira absurda",
    categoria: "caótico",
    color: "#B8860B", // Dorado militar
    impacto_historico: "Captura la locura de la guerra",
    dificultad: "intermedia",
    propiedades: {
      emociones_positivas: ["Humor"],
      emociones_negativas: ["Locura", "Angustia", "Frustración"],
      traits_ganados: ["Cinismo", "Antimilitarismo"],
      conocimientos: ["Historia", "Sociología", "Literatura"],
      cambio_personalidad: {
        neutral: { nuevo: "chaotic", probabilidad: 0.3 },
      },
    },
    afinidad: { calm: 0.4, curious: 0.7, extrovert: 0.6, chaotic: 0.95, neutral: 0.6 },
  },
  {
    titulo: "El Arcoíris de Gravedad",
    autor: "Thomas Pynchon",
    genero: "Posmoderno",
    categoria: "caótico",
    color: "#4B0082", // Índigo paranoico
    impacto_historico: "Texto denso y paranoico posmoderno",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Asombro"],
      emociones_negativas: ["Paranoia", "Confusión"],
      traits_ganados: ["Intelectualidad", "Escepticismo autoridad"],
      conocimientos: ["Física", "Psicología", "Historia"],
    },
    afinidad: { calm: 0.3, curious: 0.9, extrovert: 0.3, chaotic: 0.85, neutral: 0.5 },
  },
  {
    titulo: "La Broma Infinita",
    autor: "David Foster Wallace",
    genero: "Posmoderno enciclopédico",
    categoria: "caótico",
    color: "#556B2F", // Verde oliva denso
    impacto_historico: "Monumento al caos controlado",
    dificultad: "avanzada",
    propiedades: {
      emociones_positivas: ["Humor", "Compasión"],
      emociones_negativas: ["Tedio", "Depresión", "Obsesión"],
      traits_ganados: ["Intelectualidad", "Empatía", "Perfeccionismo"],
      conocimientos: ["Psicología", "Sociología", "Literatura", "Filosofía"],
    },
    afinidad: { calm: 0.4, curious: 0.95, extrovert: 0.4, chaotic: 0.7, neutral: 0.6 },
  },
];

// Función helper para obtener libro aleatorio por categoría
export function getRandomBookByCategory(categoria: BookContent["categoria"]): BookContent {
  const filtered = BOOKS_LIBRARY.filter(b => b.categoria === categoria);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Función helper para obtener libro por afinidad con personalidad
export function getBestBookForPersonality(
  personality: "calm" | "curious" | "extrovert" | "chaotic" | "neutral"
): BookContent {
  const sorted = [...BOOKS_LIBRARY].sort((a, b) => b.afinidad[personality] - a.afinidad[personality]);
  return sorted[0];
}

// Función para calcular si un cubo decide leer un libro (basado en afinidad)
export function shouldReadBook(
  book: BookContent,
  personality: "calm" | "curious" | "extrovert" | "chaotic" | "neutral"
): boolean {
  const affinity = book.afinidad[personality];
  return Math.random() < affinity;
}
