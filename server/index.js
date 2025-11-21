import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, _res, next) => {
  console.log(
    `[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`
  );
  next();
});

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// GET guard (helps detect wrong method usage from frontend)
app.get("/api/chat", (_req, res) => {
  res.status(405).json({ error: "Method Not Allowed. Use POST for /api/chat" });
});

// Ruta para chatear con Ollama
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "llama3.1" } = req.body || {};

    // Validación básica
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid 'messages' array" });
    }
    if (typeof model !== "string" || !model.trim()) {
      return res.status(400).json({ error: "Invalid or missing 'model'" });
    }

    const start = Date.now();
    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false, // para simplificar al inicio
      }),
    });

    const durationMs = Date.now() - start;

    if (!ollamaResponse.ok) {
      const text = await ollamaResponse.text();
      console.error("[ERR] Ollama status", ollamaResponse.status, text);
      return res
        .status(500)
        .json({ error: "Error from Ollama", detail: text, durationMs });
    }

    const data = await ollamaResponse.json();
    console.log(
      `[OK] /api/chat model=${model} messages=${messages.length} duration=${durationMs}ms`
    );
    res.json(data);
  } catch (error) {
    console.error("[EX] Error calling Ollama:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Catch-all 404 for /api/*
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
