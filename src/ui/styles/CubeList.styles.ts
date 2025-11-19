import styled from "styled-components";
import { spacing } from "../styles/scssTokens";

export const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: ${spacing.space};
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
`;

export const CubeTab = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  background: ${(props) =>
    props.$selected ? "rgba(102, 179, 255, 0.25)" : "rgba(40, 40, 50, 0.6)"};
  border: 1px solid
    ${(props) => (props.$selected ? "#66b3ff" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 8px;
  padding: ${spacing.space};
  cursor: pointer;
  transition: all 0.2s ease;
  color: #fff;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 150px;

  &:hover {
    background: ${(props) =>
      props.$selected ? "rgba(102, 179, 255, 0.35)" : "rgba(50, 50, 60, 0.8)"};
    border-color: ${(props) =>
      props.$selected ? "#66b3ff" : "rgba(255, 255, 255, 0.2)"};
    transform: translateY(-2px);
  }
`;

export const TabId = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  color: #fff;
`;

export const TabPersonality = styled.span`
  font-size: 0.75rem;
  opacity: 0.7;
`;
