import styled from "styled-components";

export const Aside = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background: rgba(20, 20, 30, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: system-ui, -apple-system, sans-serif;
`;

export const Header = styled.header`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
  }
`;

export const Count = styled.span`
  background: rgba(102, 179, 255, 0.2);
  color: #66b3ff;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
`;

export const ItemsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

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

export const CubeButton = styled.button<{ $selected: boolean }>`
  background: ${(props) =>
    props.$selected ? "rgba(102, 179, 255, 0.15)" : "rgba(40, 40, 50, 0.6)"};
  border: 1px solid
    ${(props) =>
      props.$selected ? "#66b3ff" : "rgba(255, 255, 255, 0.1)"};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
  color: inherit;
  font-family: inherit;

  &:hover {
    background: ${(props) =>
      props.$selected ? "rgba(102, 179, 255, 0.2)" : "rgba(50, 50, 60, 0.8)"};
    border-color: ${(props) =>
      props.$selected ? "#66b3ff" : "rgba(255, 255, 255, 0.2)"};
    transform: translateX(-2px);
  }
`;

export const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export const ItemId = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: #fff;
`;

export const Mode = styled.span<{ $auto: boolean }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  background: ${(props) =>
    props.$auto ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 152, 0, 0.2)"};
  color: ${(props) => (props.$auto ? "#81c784" : "#ffb74d")};
`;

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Detail = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

export const Label = styled.span`
  color: #999;
  font-weight: 500;
  min-width: 90px;
`;

export const Value = styled.span`
  color: #e0e0e0;
  font-family: "Courier New", monospace;
`;
