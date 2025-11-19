import styled from "styled-components";

export const AIStatusPanel = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  color: #e0e0e0;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.875rem;
  z-index: 1000;
  min-width: 200px;
`;

export const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const StatusIndicator = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? "#4caf50" : "#f44336")};
  box-shadow: 0 0 8px ${(props) => (props.$active ? "#4caf5080" : "#f4433680")};
`;

export const StatusLabel = styled.span`
  font-weight: 500;
`;

export const StatusValue = styled.span`
  opacity: 0.7;
  margin-left: auto;
`;

export const ToggleButton = styled.button<{ $active: boolean }>`
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: ${(props) =>
    props.$active ? "rgba(76, 175, 80, 0.2)" : "rgba(158, 158, 158, 0.2)"};
  border: 1px solid
    ${(props) => (props.$active ? "#4caf50" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 8px;
  color: ${(props) => (props.$active ? "#4caf50" : "#9e9e9e")};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$active ? "rgba(76, 175, 80, 0.3)" : "rgba(158, 158, 158, 0.3)"};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ResetButton = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(244, 67, 54, 0.15);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  color: #ff6b6b;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(244, 67, 54, 0.25);
    border-color: #f44336;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;
