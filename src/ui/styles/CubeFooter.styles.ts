import styled from "styled-components";

export const Footer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 320px; /* Leave space for the sidebar */
  height: 400px; /* Increased height for ReactFlow */
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  z-index: 1000;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
`;

export const FlowContainer = styled.div`
  width: 100%;
  height: 100%;

  /* ReactFlow custom theme for dark mode */
  .react-flow__node {
    font-family: system-ui, -apple-system, sans-serif;
  }

  .react-flow__edge-path {
    stroke-width: 2;
  }

  .react-flow__controls {
    background: rgba(40, 40, 50, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;

    button {
      background: rgba(60, 60, 70, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: #e0e0e0;

      &:hover {
        background: rgba(80, 80, 90, 0.9);
      }

      svg {
        fill: #e0e0e0;
      }
    }
  }

  .react-flow__minimap {
    background: rgba(40, 40, 50, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  .react-flow__attribution {
    background: rgba(20, 20, 30, 0.8);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 0.95rem;

  p {
    margin: 0;
  }
`;

export const PanelTitle = styled.div`
  background: rgba(102, 179, 255, 0.15);
  border: 1px solid #66b3ff;
  border-radius: 8px;
  padding: 8px 16px;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  text-transform: capitalize;
`;
