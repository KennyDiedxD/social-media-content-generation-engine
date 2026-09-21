import "dotenv/config";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://192.168.0.217:11434";

const MODEL = process.env.SOCIAL_MANAGER_MODEL ?? "gemma4:e4b";

export async function unloadTextModel() {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      keep_alive: 0,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to unload ${MODEL}: ${response.status}`);
  }

  console.log(`Unloaded Ollama model: ${MODEL}`);
}
