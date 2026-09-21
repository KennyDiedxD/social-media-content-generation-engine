import { generateImageFromPrompt as generateGeminiImage } from "./geminiImageService";
import { generateImageFromPrompt as generateComfyImage } from "./comfyImageService";

export type ImageProvider = "gemini" | "klein";

export function getImageProvider(
  requestedProvider?: ImageProvider,
): ImageProvider {
  if (requestedProvider) {
    return requestedProvider;
  }

  const provider = (process.env.IMAGE_PROVIDER ?? "gemini").toLowerCase();

  if (provider === "klein" || provider === "comfy") {
    return "klein";
  }

  return "gemini";
}

async function unloadOllamaModel(): Promise<void> {
  const ollamaUrl = process.env.OLLAMA_URL ?? "http://192.168.0.217:11434";

  const model = process.env.SOCIAL_MANAGER_MODEL ?? "gemma4:e4b";

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: "",
        stream: false,
        keep_alive: 0,
      }),
    });

    if (!response.ok) {
      console.warn("Could not unload Ollama model:", response.status);
      return;
    }

    console.log(`Ollama model unloaded before Klein: ${model}`);
  } catch (error) {
    // Image generation should still continue if unloading fails.
    console.warn("Could not unload Ollama model:", error);
  }
}

export async function generateImageFromPrompt(
  prompt: string,
  requestedProvider?: ImageProvider,
): Promise<Buffer> {
  const provider = getImageProvider(requestedProvider);

  if (provider === "klein") {
    await unloadOllamaModel();

    return generateComfyImage(prompt);
  }

  return generateGeminiImage(prompt);
}
