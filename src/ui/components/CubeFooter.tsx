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
import type { CubeData } from "./CubeList";
import {
  Footer,
  EmptyState,
  FlowContainer,
  PanelTitle,
} from "../styles/CubeFooter.styles";

type FooterCube = CubeData & {
  capabilities?: { navigation: boolean; selfRighting: boolean };
};

interface CubeFooterProps {
  cubes: FooterCube[];
  selectedId: string | null;
}

export default function CubeFooter({ cubes, selectedId }: CubeFooterProps) {
  const selectedCube = useMemo(
    () => cubes.find((c) => c.id === selectedId),
    [cubes, selectedId]
  );

  // Build nodes and edges for ReactFlow
  const { nodes, edges } = useMemo(() => {
    if (!selectedCube) return { nodes: [], edges: [] };

    const nodes: FlowNode[] = [];
    const edges: Edge[] = [];

    // Central cube node
    const cubeNode: FlowNode = {
      id: "cube",
      type: "default",
      position: { x: 400, y: 150 },
      data: {
        label: `${selectedCube.id} - ${selectedCube.personality}`,
      },
      style: {
        background: "rgba(102, 179, 255, 0.2)",
        border: "2px solid #66b3ff",
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

    // Knowledge nodes
    const knowledgeData = [
      { label: "Física básica", active: true },
      {
        label: "Auto-enderezamiento",
        active: !!selectedCube.capabilities?.selfRighting,
      },
      {
        label: "Saltos calculados",
        active: !!selectedCube.capabilities?.navigation,
      },
      { label: "Expresión facial", active: selectedCube.eyeStyle === "bubble" },
      { label: "Interacción social", active: true },
      { label: "Aprendizaje activo", active: true },
    ];

    knowledgeData.forEach((knowledge, idx) => {
      const id = `knowledge-${nodeId++}`;
      nodes.push({
        id,
        type: "default",
        position: {
          x: 300 + (idx % 3) * 150,
          y: 350 + Math.floor(idx / 3) * 80,
        },
        data: { label: `🧠 ${knowledge.label}` },
        style: {
          background: knowledge.active
            ? "rgba(102, 179, 255, 0.15)"
            : "rgba(40, 40, 50, 0.6)",
          border: knowledge.active
            ? "1px solid #66b3ff"
            : "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          padding: "8px 12px",
          color: knowledge.active ? "#fff" : "#999",
          fontSize: "0.875rem",
          opacity: knowledge.active ? 1 : 0.6,
        },
      });
      if (knowledge.active) {
        edges.push({
          id: `e-${id}`,
          source: "cube",
          target: id,
          animated: true,
          style: { stroke: "#66b3ff" },
        });
      }
    });

    return { nodes, edges };
  }, [selectedCube]);

  const onNodesChange = useCallback(() => {
    // Allow node dragging but don't persist changes
  }, []);

  const onEdgesChange = useCallback(() => {
    // Allow edge interactions but don't persist changes
  }, []);

  if (!selectedCube) {
    return (
      <Footer>
        <EmptyState>
          <p>Selecciona un cubo para ver su información</p>
        </EmptyState>
      </Footer>
    );
  }

  return (
    <Footer>
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
    </Footer>
  );
}
