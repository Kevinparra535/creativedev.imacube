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
  initializeEnvironment,
  clearCubesStorage,
} from "../utils/cubeStorage";
import type { CubeData } from "./components/CubeList";
import { useCommunityCubes } from "./hooks/useCommunityStore";
import { useCubePersistence } from "./hooks/useCubePersistence";
import {
  analyzeIntent,
  extractConcepts,
  generateResponse,
  generateVisualEffects,
} from "../systems/InteractionSystem";
import { updateCube, getCube } from "../systems/Community";
import type { ActiveModifier } from "../systems/Community";
import {
  initializeOpenAI,
  getOpenAIService,
  isOpenAIInitialized,
} from "../services/AI.service";
import { updateIdentityWithHints } from "../services/Identity.service";
import {
  initializeCubeMemory,
  updateCubeMemory,
  extractMemoryFromMessage,
} from "../services/CubeMemory.service";
import { getOpenAIConfig, isOpenAIConfigured } from "../config/ai.config";
import type { Personality } from "./components/CubeList";

// Cache de respuestas para evitar llamadas repetidas
const responseCache = new Map<string, string>();

function App() {
  // Enable automatic cube state persistence
  useCubePersistence();

  // Editor state - show on first load
  const [showEditor, setShowEditor] = useState(() => isFirstTimeUser());
  const [dynamicCubes, setDynamicCubes] = useState<CubeData[]>(() =>
    loadCubesFromStorage()
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cameraLocked, setCameraLocked] = useState(true);
  const [cubeResponse, setCubeResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [conversationTimestamp, setConversationTimestamp] = useState(0); // For triggering cube reactions

  // Persistir preferencia de AI en localStorage
  const [useAI, setUseAI] = useState(() => {
    const saved = localStorage.getItem("useAI");
    return saved ? JSON.parse(saved) : false;
  });

  const [aiConfigured, setAiConfigured] = useState(false);

  // Tracking de uso y costos
  const [totalTokens, setTotalTokens] = useState(() => {
    const saved = localStorage.getItem("totalTokens");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [messageCount, setMessageCount] = useState(() => {
    const saved = localStorage.getItem("messageCount");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Handle cube creation from editor
  const handleCreateCube = useCallback(
    (cubeData: {
      name: string;
      color: string;
      eyeStyle: "bubble" | "dot";
      personality: Personality;
    }) => {
      const newCube = addCubeToStorage(cubeData);

      // **Inicializar memoria dinámica del cubo**
      initializeCubeMemory(
        newCube.id,
        newCube.personality || "neutral",
        newCube.name || `Cube ${newCube.id}`
      );

      // Initialize environment with NPC cubes after user creates their first cube
      initializeEnvironment();

      // Reload all cubes (including NPCs)
      const allCubes = loadCubesFromStorage();
      setDynamicCubes(allCubes);
      setShowEditor(false);

      // Auto-select the user's cube
      setSelectedId(newCube.id);
    },
    []
  );

  // Rate limiting
  const lastMessageTimeRef = useRef(0);
  const MIN_MESSAGE_INTERVAL = 1000; // 1 segundo

  const visualEffectsRef = useRef<
    Map<string, ReturnType<typeof generateVisualEffects>>
  >(new Map());
  const live = useCommunityCubes();

  // Persistir preferencia de AI
  useEffect(() => {
    localStorage.setItem("useAI", JSON.stringify(useAI));
  }, [useAI]);

  // Persistir tracking de uso
  useEffect(() => {
    localStorage.setItem("totalTokens", totalTokens.toString());
    localStorage.setItem("messageCount", messageCount.toString());
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
          backend: config.backend,
          localUrl: config.localUrl,
          localModel: config.localModel,
        });
        setUseAI(true);
        setAiConfigured(true);
        console.log("✅ AI inicializado correctamente");
      } catch (error) {
        console.error("❌ Error inicializando AI:", error);
        setUseAI(false);
        setAiConfigured(false);
      }
    } else {
      console.log("ℹ️ AI no configurado. Usando respuestas template-based.");
      setUseAI(false);
      setAiConfigured(false);
    }

    // **Inicializar memoria dinámica para todos los cubos existentes**
    dynamicCubes.forEach((cube) => {
      initializeCubeMemory(
        cube.id,
        cube.personality || "neutral",
        cube.name || `Cube ${cube.id}`
      );
    });
  }, [dynamicCubes]);

  // Merge static config with live registry (position/capabilities)
  const cubesLive = useMemo(() => {
    return dynamicCubes.map((c) => {
      const found = live.find((l) => l.id === c.id);
      return {
        ...c,
        position: found?.position ?? c.position,
        personality: found?.personality ?? c.personality,
        // Attach capabilities and active modifiers if available
        capabilities: found?.capabilities,
        activeModifiers: found?.activeModifiers || [],
      };
    });
  }, [live, dynamicCubes]);

  // Retry logic con exponential backoff
  const retryWithBackoff = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      maxRetries = 3,
      delay = 1000
    ): Promise<T> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          const backoffDelay = delay * Math.pow(2, i);
          console.log(
            `⏳ Retry ${i + 1}/${maxRetries} en ${backoffDelay}ms...`
          );
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

      // **2b. Extraer información para memoria dinámica**
      const memoryUpdate = extractMemoryFromMessage(message, intent);
      updateCubeMemory(selectedId, memoryUpdate);

      // 2b. Activate transient modifiers based on personality hints
      if (concepts.personalityHints && concepts.personalityHints.length) {
        const curState = getCube(selectedId);
        const existing = curState?.activeModifiers || [];
        const now = Date.now();
        const TTL = 3 * 60 * 1000; // 3 minutos
        const hints = concepts.personalityHints;
        // Merge: refresh expiry if exists, add if new
        const map: Record<string, ActiveModifier> = {};
        existing.forEach((m) => {
          map[m.name] = m;
        });
        hints.forEach((h) => {
          map[h] = { name: h, expiresAt: now + TTL };
        });
        // Keep also non-hint existing ones that haven't expired yet
        const merged = Object.values(map).filter((m) => m.expiresAt > now);
        updateCube(selectedId, { activeModifiers: merged });
        // Identity evolution tracking (hint counters + traits vector)
        const personality: Personality =
          (curState?.personality as Personality) || "neutral";
        updateIdentityWithHints(selectedId, personality, hints);
      }

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
          response = generateResponse(
            message,
            intent,
            concepts,
            personality,
            cubeName,
            (getCube(selectedId)?.activeModifiers || []).map((m) => m.name)
          );
          setMessageCount((prev) => prev + 1);
          console.log("📝 Respuesta template-based");
        }
      } catch (error) {
        console.error("❌ Error generando respuesta:", error);
        // Fallback a template si OpenAI falla
        response = generateResponse(
          message,
          intent,
          concepts,
          personality,
          cubeName,
          (getCube(selectedId)?.activeModifiers || []).map((m) => m.name)
        );
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

  // Handler to select any cube (user or NPC)
  const handleCubeSelect = useCallback(
    (id: string) => {
      console.log("🖱️ handleCubeSelect called with:", id);

      // If empty string or no id, deselect
      if (!id || id === "") {
        console.log("⬜ Deselecting cube");
        setSelectedId(null);
        setCubeResponse(null); // Clear response cuando deseleccionamos
        return;
      }

      const cube = dynamicCubes.find((c) => c.id === id);
      if (cube) {
        console.log("✅ Selecting cube:", cube.id, cube.name);
        setSelectedId(id);
        setCubeResponse(null); // Clear response al cambiar de cubo
      } else {
        console.log("❌ Cube not found:", id);
        setSelectedId(null);
        setCubeResponse(null); // Clear response si no se encuentra
      }
    },
    [dynamicCubes]
  );

  // Handler to reset all cubes
  const handleReset = useCallback(() => {
    clearCubesStorage();
    // Reload page to reinitialize
    window.location.reload();
  }, []);

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
        cubePersonality={
          cubesLive.find((c) => c.id === selectedId)?.personality ?? "neutral"
        }
        onSendMessage={handleUserMessage}
        cubeResponse={cubeResponse}
        isThinking={isThinking}
        cameraLocked={cameraLocked}
        isUserCube={
          cubesLive.find((c) => c.id === selectedId)?.isUserCube ?? false
        }
      />
      <CubeFooter
        cubes={cubesLive}
        selectedId={selectedId}
        onSelect={handleCubeSelect}
      />
      <AIStatus
        isConfigured={aiConfigured}
        isEnabled={useAI}
        onToggle={setUseAI}
        totalTokens={totalTokens}
        messageCount={messageCount}
        onReset={handleReset}
      />
    </>
  );
}

export default App;
