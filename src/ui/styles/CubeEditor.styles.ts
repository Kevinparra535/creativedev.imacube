import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const EditorOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${fadeIn} 0.4s ease;
`;

export const EditorModal = styled.div`
  background: rgba(30, 30, 40, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: ${slideUp} 0.5s ease;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(102, 179, 255, 0.4);
    border-radius: 10px;

    &:hover {
      background: rgba(102, 179, 255, 0.6);
    }
  }
`;

export const EditorHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.75rem;
    color: #fff;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.6);
  }
`;

export const EditorContent = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  input[type="text"] {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #fff;
    font-size: 1rem;
    font-family: inherit;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgba(102, 179, 255, 0.5);
      background: rgba(0, 0, 0, 0.4);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
`;

export const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const ColorPalette = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
`;

export const ColorOption = styled.button<{ $color: string; $selected: boolean }>`
  width: 100%;
  aspect-ratio: 1;
  background: ${(props) => props.$color};
  border: 3px solid
    ${(props) =>
      props.$selected ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.2)"};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &::after {
    content: ${(props) => (props.$selected ? '"✓"' : '""')};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  &:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const EyeStyleSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

export const EyeStyleOption = styled.button<{ $selected: boolean }>`
  background: ${(props) =>
    props.$selected ? "rgba(102, 179, 255, 0.2)" : "rgba(0, 0, 0, 0.3)"};
  border: 2px solid
    ${(props) =>
      props.$selected
        ? "rgba(102, 179, 255, 0.6)"
        : "rgba(255, 255, 255, 0.1)"};
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  .icon {
    font-size: 2rem;
  }

  .label {
    font-size: 1rem;
    font-weight: 500;
    color: ${(props) => (props.$selected ? "#66b3ff" : "#fff")};
  }

  .desc {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }

  &:hover {
    background: ${(props) =>
      props.$selected ? "rgba(102, 179, 255, 0.25)" : "rgba(0, 0, 0, 0.4)"};
    border-color: rgba(102, 179, 255, 0.4);
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const PersonalitySelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const PersonalityOption = styled.button<{ $selected: boolean }>`
  background: ${(props) =>
    props.$selected ? "rgba(102, 179, 255, 0.2)" : "rgba(0, 0, 0, 0.3)"};
  border: 2px solid
    ${(props) =>
      props.$selected
        ? "rgba(102, 179, 255, 0.6)"
        : "rgba(255, 255, 255, 0.1)"};
  border-radius: 10px;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;

  .label {
    font-size: 1rem;
    font-weight: 500;
    color: ${(props) => (props.$selected ? "#66b3ff" : "#fff")};
    margin-bottom: 0.25rem;
  }

  .description {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
  }

  &:hover {
    background: ${(props) =>
      props.$selected ? "rgba(102, 179, 255, 0.25)" : "rgba(0, 0, 0, 0.4)"};
    border-color: rgba(102, 179, 255, 0.4);
    transform: translateX(4px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

export const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
`;

const rotate3d = keyframes`
  0% {
    transform: rotateY(0deg) rotateX(10deg);
  }
  100% {
    transform: rotateY(360deg) rotateX(10deg);
  }
`;

export const PreviewCube = styled.div<{ $color: string }>`
  width: 120px;
  height: 120px;
  position: relative;
  transform-style: preserve-3d;
  animation: ${rotate3d} 8s linear infinite;
  margin: 1.5rem 0;

  .cube-face {
    position: absolute;
    width: 120px;
    height: 120px;
    background: ${(props) => props.$color};
    border: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);

    &.front {
      transform: translateZ(60px);
    }
  }

  .cube-name {
    position: absolute;
    bottom: -2.5rem;
    left: 50%;
    transform: translateX(-50%);
    color: #fff;
    font-weight: 500;
    font-size: 0.95rem;
    white-space: nowrap;
    animation: none;
  }

  .cube-personality {
    position: absolute;
    bottom: -4rem;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    text-transform: capitalize;
    animation: none;
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

export const CreateButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 1rem 3rem;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

  &:hover {
    box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
    transform: translateY(-2px);
    animation: ${pulse} 2s ease infinite;
  }

  &:active {
    transform: scale(0.98);
  }
`;
