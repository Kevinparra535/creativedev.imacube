import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import R3FCanvas from "./scene/R3FCanvas";
import { GlobalStyles } from "./styles/base";
import CubeFooter from "./components/CubeFooter";
import CubeInteraction from "./components/CubeInteraction";
import AIStatus from "./components/AIStatus";
import { CubeEditor } from "./components/CubeEditor";
import { 
  loadCubesFromStorage, 
  addCubeToStorage, 
  isFirstTimeUser,
  initializeEnvironment 
} from "../utils/cubeStorage";
import type { CubeData } from "./components/CubeList";
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

// Cache de respuestas para evitar llamadas repetidas
const responseCache = new Map<string, string>();

function App() {
  // Editor state - show on first load
  const [showEditor, setShowEditor] = useState(() => isFirstTimeUser());
  const [dynamicCubes, setDynamicCubes] = useState<CubeData[]>(() => loadCubesFromStorage());
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraLocked, setCameraLocked] = useState(true);
  const [cubeResponse, setCubeResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [conversationTimestamp, setConversationTimestamp] = useState(0); // For triggering cube reactions
  
  // Persistir preferencia de AI en localStorage
  const [useAI, setUseAI] = useState(() => {
    const saved = localStorage.getItem('useAI');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [aiConfigured, setAiConfigured] = useState(false);
  
  // Tracking de uso y costos
  const [totalTokens, setTotalTokens] = useState(() => {
    const saved = localStorage.getItem('totalTokens');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [messageCount, setMessageCount] = useState(() => {
    const saved = localStorage.getItem('messageCount');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // Handle cube creation from editor
  const handleCreateCube = useCallback((cubeData: {
    name: string;
    color: string;
    eyeStyle: "bubble" | "dot";
    personality: Personality;
  }) => {
    const newCube = addCubeToStorage(cubeData);
    
    // Initialize environment with NPC cubes after user creates their first cube
    initializeEnvironment();
    
    // Reload all cubes (including NPCs)
    const allCubes = loadCubesFromStorage();
    setDynamicCubes(allCubes);
    setShowEditor(false);
    
    // Auto-select the user's cube
    setSelectedId(newCube.id);
  }, []);
  
  // Rate limiting
  const lastMessageTimeRef = useRef(0);
  const MIN_MESSAGE_INTERVAL = 1000; // 1 segundo
  
  const visualEffectsRef = useRef<Map<string, ReturnType<typeof generateVisualEffects>>>(new Map());
  const live = useCommunityCubes();

  // Persistir preferencia de AI
  useEffect(() => {
    localStorage.setItem('useAI', JSON.stringify(useAI));
  }, [useAI]);

  // Persistir tracking de uso
  useEffect(() => {
    localStorage.setItem('totalTokens', totalTokens.toString());
    localStorage.setItem('messageCount', messageCount.toString());
  }, [totalTokens, messageCount]);

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
    return dynamicCubes.map((c) => {
      const found = live.find((l) => l.id === c.id);
      return {
        ...c,
        position: found?.position ?? c.position,
        personality: found?.personality ?? c.personality,
        // Attach capabilities for footer if available
        capabilities: found?.capabilities,
      };
    });
  }, [live, dynamicCubes]);

  // Retry logic con exponential backoff
  const retryWithBackoff = useCallback(
    async <T,>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          const backoffDelay = delay * Math.pow(2, i);
          console.log(`⏳ Retry ${i + 1}/${maxRetries} en ${backoffDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
      throw new Error("Max retries exceeded");
    },
    []
  );

  // Handle message from user → process → respond
  const handleUserMessage = useCallback(
    async (message: string) => {
      if (!selectedId) return;

      // Rate limiting
      const now = Date.now();
      if (now - lastMessageTimeRef.current < MIN_MESSAGE_INTERVAL) {
        console.warn("⏱️ Espera un momento antes de enviar otro mensaje");
        return;
      }
      lastMessageTimeRef.current = now;

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

      // 4. Check cache
      const cacheKey = `${personality}:${message.toLowerCase().trim()}`;
      if (responseCache.has(cacheKey)) {
        console.log("💾 Respuesta desde caché");
        setCubeResponse(responseCache.get(cacheKey)!);
        setIsThinking(false);
        return;
      }

      let response: string;

      try {
        // 5a. Intentar usar OpenAI si está disponible
        if (useAI && isOpenAIInitialized()) {
          const aiService = getOpenAIService();
          
          // Retry con backoff
          const aiResponse = await retryWithBackoff(async () => {
            return await aiService.generateResponse(
              selectedId,
              message,
              personality,
              cubeName,
              intent,
              concepts
            );
          });

          if (aiResponse.success && aiResponse.response) {
            response = aiResponse.response;
            
            // Track tokens y costos
            const tokensUsed = aiResponse.usage?.totalTokens || 0;
            setTotalTokens((prev) => prev + tokensUsed);
            setMessageCount((prev) => prev + 1);
            
            console.log("🤖 Respuesta de OpenAI:", {
              tokens: tokensUsed,
              total: totalTokens + tokensUsed,
            });
          } else {
            throw new Error(aiResponse.error || "Error en OpenAI");
          }
        } else {
          // 5b. Fallback a respuestas template-based
          response = generateResponse(message, intent, concepts, personality, cubeName);
          setMessageCount((prev) => prev + 1);
          console.log("📝 Respuesta template-based");
        }
      } catch (error) {
        console.error("❌ Error generando respuesta:", error);
        // Fallback a template si OpenAI falla
        response = generateResponse(message, intent, concepts, personality, cubeName);
        setMessageCount((prev) => prev + 1);
      }

      // 6. Guardar en caché (limitar tamaño a 100 entradas)
      if (responseCache.size >= 100) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) {
          responseCache.delete(firstKey);
        }
      }
      responseCache.set(cacheKey, response);

      // 5. Generate visual effects
      const effects = generateVisualEffects(intent, concepts);
      visualEffectsRef.current.set(selectedId, effects);

      // 7. Set response
      setCubeResponse(response);
      setConversationTimestamp(Date.now()); // Trigger cube reaction
      setIsThinking(false);

      // Clear visual effects after animation duration
      setTimeout(() => {
        visualEffectsRef.current.delete(selectedId);
      }, 3000);
    },
    [selectedId, cubesLive, useAI, retryWithBackoff, totalTokens]
  );

  // Handler to restrict selection to user's cube only
  const handleCubeSelect = useCallback((id: string) => {
    const cube = dynamicCubes.find(c => c.id === id);
    // Only allow selection of user's cube
    if (cube && cube.isUserCube) {
      setSelectedId(id);
    } else {
      // Deselect if clicking on NPC cube
      setSelectedId(null);
    }
  }, [dynamicCubes]);

  return (
    <>
      <GlobalStyles />
      {showEditor && <CubeEditor onCreateCube={handleCreateCube} />}
      <R3FCanvas 
        cubes={dynamicCubes}
        selectedId={selectedId} 
        onSelect={handleCubeSelect} 
        cameraLocked={cameraLocked} 
        onCameraLockChange={setCameraLocked}
        conversationMessage={cubeResponse}
        conversationTimestamp={conversationTimestamp}
      />
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
      <CubeFooter cubes={cubesLive} selectedId={selectedId} onSelect={handleCubeSelect} />
      <AIStatus 
        isConfigured={aiConfigured} 
        isEnabled={useAI} 
        onToggle={setUseAI}
        totalTokens={totalTokens}
        messageCount={messageCount}
      />
    </>
  );
}

export default App;
