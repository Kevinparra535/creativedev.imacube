import { useState } from "react";
import type { Personality, EyeStyle } from "./CubeList";
import {
  EditorOverlay,
  EditorModal,
  EditorHeader,
  EditorContent,
  FormSection,
  FormLabel,
  ColorPalette,
  ColorOption,
  EyeStyleSelector,
  EyeStyleOption,
  PersonalitySelector,
  PersonalityOption,
  PreviewSection,
  PreviewCube,
  ActionButtons,
  CreateButton,
} from "../styles/CubeEditor.styles";

interface CubeEditorProps {
  onCreateCube: (cubeData: {
    name: string;
    color: string;
    eyeStyle: EyeStyle;
    personality: Personality;
  }) => void;
}

const COLOR_PRESETS = [
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
];

const PERSONALITIES: {
  value: Personality;
  label: string;
  description: string;
}[] = [
  {
    value: "calm",
    label: "Calm (Zen)",
    description: "Filosófico, tranquilo, contemplativo",
  },
  {
    value: "extrovert",
    label: "Extrovert (Social)",
    description: "Alegre, sociable, enérgico",
  },
  {
    value: "curious",
    label: "Curious (Explorador)",
    description: "Inquisitivo, aventurero",
  },
  {
    value: "chaotic",
    label: "Chaotic (Caos)",
    description: "Impredecible, salvaje, intenso",
  },
  {
    value: "neutral",
    label: "Neutral (Observador)",
    description: "Equilibrado, informativo",
  },
];

export function CubeEditor({ onCreateCube }: CubeEditorProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#808080");
  const [eyeStyle, setEyeStyle] = useState<EyeStyle>("bubble");
  const [personality, setPersonality] = useState<Personality>("calm");

  const handleCreate = () => {
    const cubeName =
      name.trim() ||
      `Cube ${personality.charAt(0).toUpperCase() + personality.slice(1)}`;
    onCreateCube({
      name: cubeName,
      color,
      eyeStyle,
      personality,
    });
  };

  return (
    <EditorOverlay>
      <EditorModal>
        <EditorHeader>
          <h2>🎨 Crea tu Primer Cubo</h2>
          <p>Diseña un cubo único con personalidad propia</p>
        </EditorHeader>

        <EditorContent>
          {/* Nombre */}
          <FormSection>
            <FormLabel>Nombre del Cubo</FormLabel>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Mi Cubo Especial"
              maxLength={30}
            />
          </FormSection>

          {/* Color */}
          <FormSection>
            <FormLabel>Color</FormLabel>
            <ColorPalette>
              {COLOR_PRESETS.map((preset) => (
                <ColorOption
                  key={preset.value}
                  $color={preset.value}
                  $selected={color === preset.value}
                  onClick={() => setColor(preset.value)}
                  title={preset.name}
                />
              ))}
            </ColorPalette>
          </FormSection>

          {/* Estilo de Ojos */}
          <FormSection>
            <FormLabel>Estilo de Ojos</FormLabel>
            <EyeStyleSelector>
              <EyeStyleOption
                $selected={eyeStyle === "bubble"}
                onClick={() => setEyeStyle("bubble")}
              >
                <span className="icon">👁️</span>
                <span className="label">Bubble</span>
                <span className="desc">Ojos redondos y expresivos</span>
              </EyeStyleOption>
              <EyeStyleOption
                $selected={eyeStyle === "dot"}
                onClick={() => setEyeStyle("dot")}
              >
                <span className="icon">⚫</span>
                <span className="label">Dot</span>
                <span className="desc">Ojos simples y minimalistas</span>
              </EyeStyleOption>
            </EyeStyleSelector>
          </FormSection>

          {/* Personalidad */}
          <FormSection>
            <FormLabel>Personalidad</FormLabel>
            <PersonalitySelector>
              {PERSONALITIES.map((p) => (
                <PersonalityOption
                  key={p.value}
                  $selected={personality === p.value}
                  onClick={() => setPersonality(p.value)}
                >
                  <div className="label">{p.label}</div>
                  <div className="description">{p.description}</div>
                </PersonalityOption>
              ))}
            </PersonalitySelector>
          </FormSection>

          {/* Preview */}
          <PreviewSection>
            <FormLabel>Vista Previa</FormLabel>
            <PreviewCube $color={color}>
              <div className="cube-face front">
                {eyeStyle === "bubble" ? "👁️" : "⚫"}
              </div>
              <div className="cube-name">
                {name.trim() ||
                  `Cube ${personality.charAt(0).toUpperCase() + personality.slice(1)}`}
              </div>
              <div className="cube-personality">{personality}</div>
            </PreviewCube>
          </PreviewSection>

          {/* Actions */}
          <ActionButtons>
            <CreateButton onClick={handleCreate}>✨ Crear Cubo</CreateButton>
          </ActionButtons>
        </EditorContent>
      </EditorModal>
    </EditorOverlay>
  );
}
