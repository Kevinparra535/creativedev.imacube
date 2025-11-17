import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import R3FCanvas from "./scene/R3FCanvas";
import { CUBES_CONFIG } from "../config/cubesConfig";
import { GlobalStyles } from "./styles/base";
import CubeFooter from "./components/CubeFooter";
import CubeInteraction from "./components/CubeInteraction";
import AIStatus from "./components/AIStatus";
import { useCommunityCubes } from "./hooks/useCommunityStore";
import {
  analyzeIntent,
  extractConcepts,
  generateResponse,
  generateVisualEffects,
} from "./scene/systems/InteractionSystem";
import {
  initializeOpenAI,
  getOpenAIService,
  isOpenAIInitialized,
} from "./scene/systems/OpenAIService";
import { getOpenAIConfig, isOpenAIConfigured } from "../config/openai.config";
import type { Personality } from "./components/CubeList";

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraLocked, setCameraLocked] = useState(true);
  const [cubeResponse, setCubeResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const visualEffectsRef = useRef<Map<string, ReturnType<typeof generateVisualEffects>>>(new Map());
  const live = useCommunityCubes();

  // Inicializar OpenAI si está configurado
  useEffect(() => {
    const config = getOpenAIConfig();
    if (isOpenAIConfigured()) {
      try {
        initializeOpenAI(config.apiKey, {
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        });
        setUseAI(true);
        setAiConfigured(true);
        console.log("✅ OpenAI inicializado correctamente");
      } catch (error) {
        console.error("❌ Error inicializando OpenAI:", error);
        setUseAI(false);
        setAiConfigured(false);
      }
    } else {
      console.log("ℹ️ OpenAI no configurado. Usando respuestas template-based.");
      setUseAI(false);
      setAiConfigured(false);
    }
  }, []);

  // Merge static config with live registry (position/capabilities)
  const cubesLive = useMemo(() => {
    return CUBES_CONFIG.map((c) => {
      const found = live.find((l) => l.id === c.id);
      return {
        ...c,
        position: found?.position ?? c.position,
        personality: found?.personality ?? c.personality,
        // Attach capabilities for footer if available
        capabilities: found?.capabilities,
      };
    });
  }, [live]);

  // Handle message from user → process → respond
  const handleUserMessage = useCallback(
    async (message: string) => {
      if (!selectedId) return;

      setIsThinking(true);

      // 1. Analyze intent
      const intent = analyzeIntent(message);

      // 2. Extract concepts
      const concepts = extractConcepts(message, intent);

      // 3. Get cube personality
      const selectedCube = cubesLive.find((c) => c.id === selectedId);
      const personality: Personality =
        (selectedCube?.personality as Personality) ?? "neutral";
      const cubeName = selectedCube?.name ?? "Cube";

      let response: string;

      try {
        // 4a. Intentar usar OpenAI si está disponible
        if (useAI && isOpenAIInitialized()) {
          const aiService = getOpenAIService();
          const aiResponse = await aiService.generateResponse(
            selectedId,
            message,
            personality,
            cubeName,
            intent,
            concepts
          );

          if (aiResponse.success && aiResponse.response) {
            response = aiResponse.response;
            console.log("🤖 Respuesta de OpenAI:", {
              tokens: aiResponse.usage?.totalTokens,
            });
          } else {
            throw new Error(aiResponse.error || "Error en OpenAI");
          }
        } else {
          // 4b. Fallback a respuestas template-based
          response = generateResponse(message, intent, concepts, personality, cubeName);
          console.log("📝 Respuesta template-based");
        }
      } catch (error) {
        console.error("Error generando respuesta:", error);
        // Fallback a template si OpenAI falla
        response = generateResponse(message, intent, concepts, personality, cubeName);
      }

      // 5. Generate visual effects
      const effects = generateVisualEffects(intent, concepts);
      visualEffectsRef.current.set(selectedId, effects);

      // 6. Set response
      setCubeResponse(response);
      setIsThinking(false);

      // Clear visual effects after animation duration
      setTimeout(() => {
        visualEffectsRef.current.delete(selectedId);
      }, 3000);
    },
    [selectedId, cubesLive, useAI]
  );

  return (
    <>
      <GlobalStyles />
      <R3FCanvas selectedId={selectedId} onSelect={setSelectedId} cameraLocked={cameraLocked} onCameraLockChange={setCameraLocked} />
      <CubeInteraction
        key={selectedId} // Reset component when cube changes
        cubeId={selectedId}
        cubeName={cubesLive.find((c) => c.id === selectedId)?.name ?? ""}
        cubePersonality={cubesLive.find((c) => c.id === selectedId)?.personality ?? "neutral"}
        onSendMessage={handleUserMessage}
        cubeResponse={cubeResponse}
        isThinking={isThinking}
        cameraLocked={cameraLocked}
      />
      <CubeFooter cubes={cubesLive} selectedId={selectedId} onSelect={setSelectedId} />
      <AIStatus isConfigured={aiConfigured} isEnabled={useAI} onToggle={setUseAI} />
    </>
  );
}

export default App;
