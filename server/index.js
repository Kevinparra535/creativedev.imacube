import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta para chatear con Ollama
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model = "llama3.1" } = req.body;

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false, // para simplificar al inicio
      }),
    });

    if (!ollamaResponse.ok) {
      const text = await ollamaResponse.text();
      console.error("Error from Ollama:", text);
      return res.status(500).json({ error: "Error from Ollama", detail: text });
    }

    const data = await ollamaResponse.json();
    // data tiene algo como: { message: { role: 'assistant', content: '...' }, ... }

    res.json(data);
  } catch (error) {
    console.error("Error calling Ollama:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
