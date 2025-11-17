import {
  AIStatusPanel,
  StatusRow,
  StatusIndicator,
  StatusLabel,
  StatusValue,
  ToggleButton,
} from "../styles/AIStatus.styles";

interface AIStatusProps {
  isConfigured: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function AIStatus({ isConfigured, isEnabled, onToggle }: AIStatusProps) {
  return (
    <AIStatusPanel>
      <StatusRow>
        <StatusIndicator $active={isConfigured} />
        <StatusLabel>OpenAI</StatusLabel>
        <StatusValue>{isConfigured ? "Configurado" : "No configurado"}</StatusValue>
      </StatusRow>

      <StatusRow>
        <StatusIndicator $active={isEnabled} />
        <StatusLabel>Modo</StatusLabel>
        <StatusValue>{isEnabled ? "AI" : "Template"}</StatusValue>
      </StatusRow>

      {isConfigured && (
        <ToggleButton $active={isEnabled} onClick={() => onToggle(!isEnabled)}>
          {isEnabled ? "🤖 Usando OpenAI" : "📝 Usando Templates"}
        </ToggleButton>
      )}

      {!isConfigured && (
        <ToggleButton $active={false} disabled>
          Configura .env para activar
        </ToggleButton>
      )}
    </AIStatusPanel>
  );
}
