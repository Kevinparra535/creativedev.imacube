import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node as FlowNode,
  type Edge,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CubeList from "./CubeList";
import type { CubeData } from "./CubeList";
import {
  Footer,
  EmptyState,
  FlowContainer,
  PanelTitle,
} from "../styles/CubeFooter.styles";

// Map knowledge domain keys to Spanish display names
const DOMAIN_DISPLAY_NAMES: Record<string, string> = {
  science: "Ciencia",
  technology: "Tecnología",
  math: "Matemáticas",
  philosophy: "Filosofía",
  literature: "Literatura",
  art: "Arte",
  music: "Música",
  nature: "Naturaleza",
  theology: "Teología",
  self_awareness: "Autoconciencia",
};

type FooterCube = CubeData & {
  capabilities?: { navigation: boolean; selfRighting: boolean };
  learningProgress?: { navigation: number; selfRighting: number };
  knowledge?: Record<string, number>;
  readingExperiences?: {
    originalPersonality: string;
    emotionsExperienced: string[];
    traitsAcquired: string[];
    booksRead: string[];
    currentBook?: string;
    readingProgress?: number;
    conceptsLearned?: string[];
  };
};

interface CubeFooterProps {
  cubes: FooterCube[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CubeFooter({
  cubes,
  selectedId,
  onSelect,
}: CubeFooterProps) {
  const selectedCube = useMemo(
    () => cubes.find((c) => c.id === selectedId),
    [cubes, selectedId]
  );

  // Build nodes and edges for ReactFlow
  const { nodes, edges } = useMemo(() => {
    if (!selectedCube) return { nodes: [], edges: [] };

    const nodes: FlowNode[] = [];
    const edges: Edge[] = [];

    // Central cube node with personality change indicator
    const hasChangedPersonality =
      selectedCube.readingExperiences &&
      selectedCube.readingExperiences.originalPersonality !==
        selectedCube.personality;

    const cubeName = selectedCube.name || selectedCube.id;

    const cubeNode: FlowNode = {
      id: "cube",
      type: "default",
      position: { x: 400, y: 150 },
      data: {
        label: hasChangedPersonality
          ? `${cubeName}\n${selectedCube.readingExperiences!.originalPersonality} → ${selectedCube.personality}`
          : `${cubeName} - ${selectedCube.personality}`,
      },
      style: {
        background: hasChangedPersonality
          ? "rgba(255, 170, 0, 0.3)"
          : "rgba(102, 179, 255, 0.2)",
        border: hasChangedPersonality
          ? "2px solid #ffaa00"
          : "2px solid #66b3ff",
        borderRadius: "8px",
        padding: "10px 20px",
        color: "#fff",
        fontWeight: "600",
        fontSize: "1rem",
      },
    };
    nodes.push(cubeNode);

    let nodeId = 0;

    // Emotion nodes based on personality
    const emotionData = (() => {
      switch (selectedCube.personality) {
        case "extrovert":
          return [
            { label: "Feliz", active: true },
            { label: "Emocionado", active: true },
            { label: "Amigable", active: true },
          ];
        case "chaotic":
          return [
            { label: "Enojado", active: true },
            { label: "Frustrado", active: true },
            { label: "Energético", active: true },
          ];
        case "curious":
          return [
            { label: "Curioso", active: true },
            { label: "Pensativo", active: true },
            { label: "Asombrado", active: false },
          ];
        case "calm":
          return [
            { label: "Pacífico", active: true },
            { label: "Contento", active: true },
            { label: "Zen", active: false },
          ];
        default:
          return [
            { label: "Neutral", active: true },
            { label: "Curioso", active: false },
            { label: "Feliz", active: false },
          ];
      }
    })();

    emotionData.forEach((emotion, idx) => {
      const id = `emotion-${nodeId++}`;
      nodes.push({
        id,
        type: "default",
        position: { x: 100, y: 50 + idx * 80 },
        data: { label: `😊 ${emotion.label}` },
        style: {
          background: emotion.active
            ? "rgba(102, 179, 255, 0.15)"
            : "rgba(40, 40, 50, 0.6)",
          border: emotion.active
            ? "1px solid #66b3ff"
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          padding: "8px 12px",
          color: emotion.active ? "#fff" : "#999",
          fontSize: "0.875rem",
          opacity: emotion.active ? 1 : 0.6,
        },
      });
      if (emotion.active) {
        edges.push({
          id: `e-${id}`,
          source: id,
          target: "cube",
          animated: true,
          style: { stroke: "#66b3ff" },
        });
      }
    });

    // Personality traits
    const traitData = (() => {
      const traits: Record<string, { label: string; active: boolean }[]> = {
        calm: [
          { label: "Tranquilo", active: true },
          { label: "Observador", active: true },
          { label: "Paciente", active: false },
        ],
        extrovert: [
          { label: "Sociable", active: true },
          { label: "Expresivo", active: true },
          { label: "Optimista", active: true },
        ],
        curious: [
          { label: "Investigador", active: true },
          { label: "Analítico", active: true },
          { label: "Creativo", active: false },
        ],
        chaotic: [
          { label: "Impredecible", active: true },
          { label: "Intenso", active: true },
          { label: "Apasionado", active: true },
        ],
        neutral: [
          { label: "Equilibrado", active: true },
          { label: "Adaptable", active: false },
          { label: "Racional", active: false },
        ],
      };
      const personality = selectedCube.personality || "neutral";
      return traits[personality] || traits.neutral;
    })();

    traitData.forEach((trait, idx) => {
      const id = `trait-${nodeId++}`;
      nodes.push({
        id,
        type: "default",
        position: { x: 700, y: 50 + idx * 80 },
        data: { label: `🎭 ${trait.label}` },
        style: {
          background: trait.active
            ? "rgba(102, 179, 255, 0.15)"
            : "rgba(40, 40, 50, 0.6)",
          border: trait.active
            ? "1px solid #66b3ff"
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          padding: "8px 12px",
          color: trait.active ? "#fff" : "#999",
          fontSize: "0.875rem",
          opacity: trait.active ? 1 : 0.6,
        },
      });
      if (trait.active) {
        edges.push({
          id: `e-${id}`,
          source: "cube",
          target: id,
          animated: true,
          style: { stroke: "#66b3ff" },
        });
      }
    });

    // Knowledge nodes with progress
    const navProgress = selectedCube.learningProgress?.navigation ?? 0;
    const selfProgress = selectedCube.learningProgress?.selfRighting ?? 0;

    const knowledgeData: Array<{
      label: string;
      active: boolean;
      progress: number;
      learning?: boolean;
    }> = [
      { label: "Física básica", active: true, progress: 1 },
      {
        label: `Auto-enderezamiento${selfProgress < 1 ? ` (${Math.round(selfProgress * 100)}%)` : ""}`,
        active: !!selectedCube.capabilities?.selfRighting,
        progress: selfProgress,
        learning: selfProgress > 0 && selfProgress < 1,
      },
      {
        label: `Navegación${navProgress < 1 ? ` (${Math.round(navProgress * 100)}%)` : ""}`,
        active: !!selectedCube.capabilities?.navigation,
        progress: navProgress,
        learning: navProgress > 0 && navProgress < 1,
      },
      {
        label: "Expresión facial",
        active: selectedCube.eyeStyle === "bubble",
        progress: 1,
      },
      { label: "Interacción social", active: true, progress: 1 },
      { label: "Aprendizaje activo", active: true, progress: 1 },
    ];

    knowledgeData.forEach((knowledge, idx) => {
      const id = `knowledge-${nodeId++}`;
      const progress = knowledge.progress ?? 1;
      const learning = knowledge.learning ?? false;

      nodes.push({
        id,
        type: "default",
        position: {
          x: 300 + (idx % 3) * 150,
          y: 350 + Math.floor(idx / 3) * 80,
        },
        data: { label: `🧠 ${knowledge.label}` },
        style: {
          background: learning
            ? `linear-gradient(to right, rgba(102, 179, 255, 0.25) ${progress * 100}%, rgba(40, 40, 50, 0.6) ${progress * 100}%)`
            : knowledge.active
              ? "rgba(102, 179, 255, 0.15)"
              : "rgba(40, 40, 50, 0.6)",
          border: learning
            ? "1px solid #ffaa00"
            : knowledge.active
              ? "1px solid #66b3ff"
              : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          padding: "8px 12px",
          color: knowledge.active || learning ? "#fff" : "#999",
          fontSize: "0.875rem",
          opacity: knowledge.active || learning ? 1 : 0.6,
        },
      });
      if (knowledge.active || learning) {
        edges.push({
          id: `e-${id}`,
          source: "cube",
          target: id,
          animated: learning,
          style: { stroke: learning ? "#ffaa00" : "#66b3ff" },
        });
      }
    });

    // Knowledge domain bars below capabilities
    if (selectedCube.knowledge) {
      const domains = Object.entries(selectedCube.knowledge)
        .filter(([, value]) => (value as number) > 0)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5); // Top 5 domains

      domains.forEach(([domain, value], idx) => {
        const id = `domain-${nodeId++}`;
        const percentage = Math.min(100, Math.round((value as number) * 10));
        const displayName = DOMAIN_DISPLAY_NAMES[domain] || domain;
        nodes.push({
          id,
          type: "default",
          position: {
            x: 200 + idx * 140,
            y: 520,
          },
          data: { label: `📚 ${displayName}\n${percentage}%` },
          style: {
            background: `linear-gradient(to top, rgba(102, 179, 255, 0.3) ${percentage}%, rgba(40, 40, 50, 0.6) ${percentage}%)`,
            border: "1px solid #66b3ff",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#fff",
            fontSize: "0.75rem",
            textAlign: "center",
            minWidth: "80px",
          },
        });
        edges.push({
          id: `e-${id}`,
          source: "cube",
          target: id,
          animated: false,
          style: { stroke: "#66b3ff", opacity: 0.5 },
        });
      });
    }

    // Reading experiences section
    if (selectedCube.readingExperiences) {
      const exp = selectedCube.readingExperiences;
      let experienceNodeX = 50;
      const experienceNodeY = 350;

      // Current reading status
      if (exp.currentBook) {
        const id = `reading-${nodeId++}`;
        const progress = Math.round((exp.readingProgress || 0) * 100);
        nodes.push({
          id,
          type: "default",
          position: { x: experienceNodeX, y: experienceNodeY },
          data: { label: `📖 Leyendo\n"${exp.currentBook}"\n${progress}%` },
          style: {
            background: `linear-gradient(to right, rgba(255, 170, 0, 0.3) ${progress}%, rgba(40, 40, 50, 0.6) ${progress}%)`,
            border: "2px solid #ffaa00",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#fff",
            fontSize: "0.7rem",
            textAlign: "center",
            minWidth: "120px",
          },
        });
        edges.push({
          id: `e-${id}`,
          source: "cube",
          target: id,
          animated: true,
          style: { stroke: "#ffaa00" },
        });
        experienceNodeX += 140;
      }

      // Emotions experienced (top 5 most recent)
      if (exp.emotionsExperienced.length > 0) {
        const topEmotions = exp.emotionsExperienced.slice(-5);
        topEmotions.forEach((emotion, idx) => {
          const id = `emotion-exp-${nodeId++}`;
          nodes.push({
            id,
            type: "default",
            position: { x: experienceNodeX + idx * 100, y: experienceNodeY },
            data: { label: `💭 ${emotion}` },
            style: {
              background: "rgba(255, 100, 200, 0.2)",
              border: "1px solid #ff64c8",
              borderRadius: "6px",
              padding: "6px 10px",
              color: "#fff",
              fontSize: "0.65rem",
            },
          });
          edges.push({
            id: `e-${id}`,
            source: "cube",
            target: id,
            style: { stroke: "#ff64c8", opacity: 0.4 },
          });
        });
      }

      // Concepts learned (e.g., "Dios", "Fe")
      if (exp.conceptsLearned && exp.conceptsLearned.length > 0) {
        const recentConcepts = exp.conceptsLearned.slice(-6);
        recentConcepts.forEach((concept, idx) => {
          const id = `concept-${nodeId++}`;
          nodes.push({
            id,
            type: "default",
            position: { x: 50 + idx * 120, y: 600 },
            data: { label: `🧩 ${concept}` },
            style: {
              background: "rgba(255, 210, 90, 0.2)",
              border: "1px solid #ffd25a",
              borderRadius: "6px",
              padding: "6px 10px",
              color: "#fff",
              fontSize: "0.7rem",
            },
          });
          edges.push({
            id: `e-${id}`,
            source: "cube",
            target: id,
            style: { stroke: "#ffd25a", opacity: 0.5 },
          });
        });
      }

      // Traits acquired
      if (exp.traitsAcquired.length > 0) {
        exp.traitsAcquired.slice(0, 4).forEach((trait, idx) => {
          const id = `trait-acq-${nodeId++}`;
          nodes.push({
            id,
            type: "default",
            position: { x: 50 + idx * 150, y: 450 },
            data: { label: `✨ ${trait}` },
            style: {
              background: "rgba(100, 255, 150, 0.2)",
              border: "1px solid #64ff96",
              borderRadius: "6px",
              padding: "6px 10px",
              color: "#fff",
              fontSize: "0.7rem",
            },
          });
          edges.push({
            id: `e-${id}`,
            source: "cube",
            target: id,
            style: { stroke: "#64ff96", opacity: 0.5 },
          });
        });
      }

      // Books read count
      if (exp.booksRead.length > 0) {
        const id = `books-count-${nodeId++}`;
        nodes.push({
          id,
          type: "default",
          position: { x: 650, y: 450 },
          data: { label: `📚 Libros leídos: ${exp.booksRead.length}` },
          style: {
            background: "rgba(102, 179, 255, 0.2)",
            border: "1px solid #66b3ff",
            borderRadius: "6px",
            padding: "8px 12px",
            color: "#fff",
            fontSize: "0.75rem",
          },
        });
        edges.push({
          id: `e-${id}`,
          source: "cube",
          target: id,
          style: { stroke: "#66b3ff", opacity: 0.4 },
        });
      }
    }

    return { nodes, edges };
  }, [selectedCube]);

  const onNodesChange = useCallback(() => {
    // Allow node dragging but don't persist changes
  }, []);

  const onEdgesChange = useCallback(() => {
    // Allow edge interactions but don't persist changes
  }, []);

  return (
    <Footer>
      <CubeList cubes={cubes} selectedId={selectedId} onSelect={onSelect} />
      {selectedCube ? (
        <FlowContainer>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#444" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const border = node.style?.border;
                return typeof border === "string" && border.includes("#66b3ff")
                  ? "#66b3ff"
                  : "#666";
              }}
              maskColor="rgba(20, 20, 30, 0.8)"
            />
            <Panel position="top-left">
              <PanelTitle>
                {selectedCube.id} - {selectedCube.personality}
              </PanelTitle>
            </Panel>
          </ReactFlow>
        </FlowContainer>
      ) : (
        <EmptyState>
          <p>Selecciona un cubo para ver su información</p>
        </EmptyState>
      )}
    </Footer>
  );
}
