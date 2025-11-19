/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from "react";
import {
  InteractionPanel,
  MessageInput,
  SendButton,
  ConversationLog,
  Message,
  ThinkingIndicator,
  HeaderSection,
  HeaderTitle,
  HeaderSubtitle,
  EmptyState,
  InputContainer,
  CameraHint,
} from "../styles/CubeInteraction.styles";

interface CubeInteractionProps {
  cubeId: string | null;
  cubeName: string;
  cubePersonality: string;
  onSendMessage: (message: string) => void;
  cubeResponse: string | null;
  isThinking: boolean;
  cameraLocked?: boolean;
}

export { type CubeInteractionProps };

export default function CubeInteraction({
  cubeId,
  cubeName,
  cubePersonality,
  onSendMessage,
  cubeResponse,
  isThinking,
  cameraLocked,
}: CubeInteractionProps) {
  const [inputValue, setInputValue] = useState("");
  const [conversation, setConversation] = useState<
    Array<{ sender: "user" | "cube"; text: string; timestamp: number }>
  >([]);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const lastResponseTextRef = useRef("");

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length]);

  // Add cube response (debounced by ref check)
  // Note: React 19 warns about setState in effects, but this is a legitimate use case:
  // we're accumulating messages from an external system (user conversation), not deriving state
  useEffect(() => {
    if (!cubeResponse || cubeResponse === lastResponseTextRef.current) return;
    lastResponseTextRef.current = cubeResponse;

    setConversation((prev) => [
      ...prev,
      { sender: "cube", text: cubeResponse, timestamp: Date.now() },
    ]);
  }, [cubeResponse]);

  const handleSend = () => {
    if (!inputValue.trim() || !cubeId) return;

    // Add user message to conversation
    setConversation((prev) => [
      ...prev,
      { sender: "user", text: inputValue, timestamp: Date.now() },
    ]);

    // Send to parent for processing
    onSendMessage(inputValue);

    // Clear input
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!cubeId) {
    return (
      <InteractionPanel>
        <EmptyState>Selecciona un cubo para interactuar</EmptyState>
      </InteractionPanel>
    );
  }

  return (
    <InteractionPanel>
      <HeaderSection>
        <HeaderTitle>Conversando con {cubeName}</HeaderTitle>
        <HeaderSubtitle>Personalidad: {cubePersonality}</HeaderSubtitle>
      </HeaderSection>

      <ConversationLog>
        {conversation.length === 0 ? (
          <EmptyState>Escribe algo para iniciar la conversación...</EmptyState>
        ) : (
          <>
            {conversation.map((msg, idx) => (
              <Message key={idx} $sender={msg.sender}>
                <div className="message-bubble">{msg.text}</div>
              </Message>
            ))}
            {isThinking && (
              <ThinkingIndicator>
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </ThinkingIndicator>
            )}
            <div ref={conversationEndRef} />
          </>
        )}
      </ConversationLog>

      {cubeId && (
        <CameraHint $locked={cameraLocked ?? true}>
          {cameraLocked ? "🔒 Cámara bloqueada" : "🔓 Cámara libre"}
          <span>Presiona TAB para {cameraLocked ? "desbloquear" : "bloquear"}</span>
        </CameraHint>
      )}

      <InputContainer>
        <MessageInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          disabled={isThinking}
        />
        <SendButton
          onClick={handleSend}
          disabled={!inputValue.trim() || isThinking}
        >
          ➤
        </SendButton>
      </InputContainer>
    </InteractionPanel>
  );
}
