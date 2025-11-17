import styled, { keyframes } from "styled-components";

export const InteractionPanel = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 400px;
  height: 100vh;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: system-ui, -apple-system, sans-serif;
`;

export const ConversationLog = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

export const Message = styled.div<{ $sender: "user" | "cube" }>`
  display: flex;
  justify-content: ${(props) =>
    props.$sender === "user" ? "flex-end" : "flex-start"};

  .message-bubble {
    max-width: 70%;
    padding: 0.75rem 1rem;
    border-radius: ${(props) =>
      props.$sender === "user"
        ? "12px 12px 4px 12px"
        : "12px 12px 12px 4px"};
    background: ${(props) =>
      props.$sender === "user"
        ? "rgba(102, 179, 255, 0.2)"
        : "rgba(80, 80, 100, 0.4)"};
    border: 1px solid
      ${(props) =>
        props.$sender === "user"
          ? "rgba(102, 179, 255, 0.3)"
          : "rgba(255, 255, 255, 0.1)"};
    color: #fff;
    font-size: 0.875rem;
    line-height: 1.4;
    word-wrap: break-word;
  }
`;

const thinkingAnimation = keyframes`
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
`;

export const ThinkingIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  align-self: flex-start;

  span {
    width: 8px;
    height: 8px;
    background: rgba(102, 179, 255, 0.6);
    border-radius: 50%;
    animation: ${thinkingAnimation} 1.4s infinite ease-in-out;

    &:nth-child(1) {
      animation-delay: 0s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
`;

export const MessageInput = styled.input`
  flex: 1;
  background: rgba(40, 40, 50, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #66b3ff;
    background: rgba(40, 40, 50, 0.8);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SendButton = styled.button`
  background: rgba(102, 179, 255, 0.2);
  border: 1px solid #66b3ff;
  border-radius: 8px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #66b3ff;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(102, 179, 255, 0.3);
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export const HeaderSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #fff;
`;

export const HeaderSubtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
  opacity: 0.6;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  opacity: 0.5;
`;

export const InputContainer = styled.div`
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
`;

export const CameraHint = styled.div<{ $locked: boolean }>`
  padding: 0.75rem 1rem;
  background: ${(props) =>
    props.$locked ? "rgba(76, 175, 80, 0.15)" : "rgba(255, 152, 0, 0.15)"};
  border-top: 1px solid
    ${(props) =>
      props.$locked ? "rgba(76, 175, 80, 0.3)" : "rgba(255, 152, 0, 0.3)"};
  color: ${(props) => (props.$locked ? "#81c784" : "#ffb74d")};
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  animation: fadeIn 0.3s ease;

  span {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
