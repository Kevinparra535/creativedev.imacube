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
  totalTokens?: number;
  messageCount?: number;
  onReset?: () => void;
}

export default function AIStatus({ 
  isConfigured, 
  isEnabled, 
  onToggle,
  totalTokens = 0,
  messageCount = 0,
  onReset
}: AIStatusProps) {
  // Calcular costo estimado (gpt-4o-mini: $0.15/1M input, $0.60/1M output, promedio ~$0.30/1M)
  const estimatedCost = (totalTokens / 1_000_000) * 0.30;

  const handleReset = () => {
    if (window.confirm("⚠️ ¿Estás seguro?\n\nEsto reiniciará TODOS los cubos a su estado inicial:\n• Posiciones originales\n• Conocimiento perdido\n• Libros leídos borrados\n• Emociones reiniciadas\n\n¿Continuar?")) {
      onReset?.();
    }
  };

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

      {isConfigured && totalTokens > 0 && (
        <>
          <StatusRow>
            <StatusLabel>Mensajes</StatusLabel>
            <StatusValue>{messageCount}</StatusValue>
          </StatusRow>
          
          <StatusRow>
            <StatusLabel>Tokens</StatusLabel>
            <StatusValue>{totalTokens.toLocaleString()}</StatusValue>
          </StatusRow>
          
          <StatusRow>
            <StatusLabel>Costo est.</StatusLabel>
            <StatusValue>${estimatedCost.toFixed(4)}</StatusValue>
          </StatusRow>
        </>
      )}

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

      {onReset && (
        <ResetButton onClick={handleReset}>
          🔄 Reiniciar Todo
        </ResetButton>
      )}
    </AIStatusPanel>
  );
}
