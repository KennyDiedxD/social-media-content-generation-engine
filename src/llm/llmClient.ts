import "dotenv/config";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://192.168.0.217:11434";

const MODEL =
  process.env.SOCIAL_MANAGER_MODEL ?? process.env.OLLAMA_MODEL ?? "gemma4:e4b";
type GenerateOptions = {
  json?: boolean;
  temperature?: number;
};

type OllamaGenerateResponse = {
  response: string;
};

export async function generateText(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,

      ...(options.json ? { format: "json" } : {}),

      options: {
        temperature: options.temperature ?? 0.6,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Ollama request failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;

  return data.response.trim();
}
