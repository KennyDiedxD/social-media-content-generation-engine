import "dotenv/config";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:e4b";

type OllamaGenerateResponse = {
  response?: string;
  done?: boolean;
  error?: string;
};

export async function generateText(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;

  if (data.error) {
    throw new Error(`Ollama error: ${data.error}`);
  }

  return data.response?.trim() || "";
}