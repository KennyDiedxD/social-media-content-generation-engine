import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateImageFromPrompt(prompt: string): Promise<Buffer> {
  const result = await ai.models.generateContent({
    model: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const parts = result.candidates?.[0]?.content?.parts ?? [];

  const imagePart = parts.find((part: any) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image returned from Gemini");
  }

  return Buffer.from(imagePart.inlineData.data, "base64");
}
