import {
  AIStatusPanel,
  StatusRow,
  StatusIndicator,
  StatusLabel,
  StatusValue,
  ToggleButton,
  ResetButton,
} from "../styles/AIStatus.styles";

interface AIStatusProps {
  isConfigured: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  messageCount?: number;
  onReset?: () => void;
}

export default function AIStatus({
  isConfigured,
  isEnabled,
  onToggle,
  messageCount = 0,
  onReset,
}: AIStatusProps) {

  const handleReset = () => {
    if (
      window.confirm(
        "⚠️ ¿Estás seguro?\n\nEsto reiniciará TODOS los cubos a su estado inicial:\n• Posiciones originales\n• Conocimiento perdido\n• Libros leídos borrados\n• Emociones reiniciadas\n\n¿Continuar?"
      )
    ) {
      onReset?.();
    }
  };

  return (
    <AIStatusPanel>
      <StatusRow>
        <StatusIndicator $active={isConfigured} />
        <StatusLabel>IA Local</StatusLabel>
        <StatusValue>
          {isConfigured ? "Configurado" : "No configurado"}
        </StatusValue>
      </StatusRow>

      <StatusRow>
        <StatusIndicator $active={isEnabled} />
        <StatusLabel>Modo</StatusLabel>
        <StatusValue>{isEnabled ? "AI" : "Template"}</StatusValue>
      </StatusRow>

      {isConfigured && messageCount > 0 && (
        <StatusRow>
          <StatusLabel>Mensajes</StatusLabel>
          <StatusValue>{messageCount}</StatusValue>
        </StatusRow>
      )}

      {isConfigured && (
        <ToggleButton $active={isEnabled} onClick={() => onToggle(!isEnabled)}>
          {
isEnabled ? "🤖 Usando IA Local" : "📝 Usando Templates"
}
        </ToggleButton>
      )}

      {!isConfigured && (
        <ToggleButton $active={false} disabled>
          Configura .env para activar
        </ToggleButton>
      )}

      {onReset && (
        <ResetButton onClick={handleReset}>🔄 Reiniciar Todo</ResetButton>
      )}
    </AIStatusPanel>
  );
}
