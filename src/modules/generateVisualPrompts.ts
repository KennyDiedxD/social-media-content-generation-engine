import { generateText } from "../llm/llmClient";
import type { CoreContext } from "./loadContext";
import type { InstagramCarousel } from "./generateInstagramCarousel";
import type { LinkedInPost } from "./generateLinkedInPost";

export type VisualPrompt = {
  assetType: "linkedin_header" | "instagram_carousel";
  platform: string;
  aspectRatio: string;
  prompt: string;
  negativePrompt: string;
};

export type VisualPromptBundle = {
  prompts: VisualPrompt[];
};

export async function generateVisualPrompts(
  assets: {
    linkedinPost?: LinkedInPost;
    instagramCarousel?: InstagramCarousel;
  },
  context: CoreContext
): Promise<VisualPromptBundle> {
    const prompt = `
You are Eddy's visual prompt designer.

Create visual generation prompts for the supplied content assets.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanation.

Rules:
- Return exactly 2 prompts total.
- Prompt 1 must be for LinkedIn header.
- Prompt 2 must be for Instagram carousel.
- For Instagram carousel, create only ONE unified visual prompt for the entire carousel.
- Do not create slide-by-slide prompts.
- Each prompt must be under 120 words.
- Each negativePrompt must be under 40 words.
- Prompts should work in image generation tools.
- Do not mention tool names.
- Visuals should feel Indian, warm, calm, modern, and educational.
- Avoid robots, sci-fi, scary exam pressure, report cards, marks, ranks.
- Prefer home-study, notebook, whiteboard, learning-map, parent-child discussion, tutor-guide metaphors.
- Follow Eddy Creative Brain strictly.
- Use Eddy's brand colors: #154C79 and #1E81B0.
- Use Poppins typography in all visual directions.

Eddy Brand Brain:
${context.brandBrain}

Eddy Creative Brain:
${context.creativeBrain}

Assets:
${JSON.stringify(assets, null, 2)}

Return JSON in this exact format:
{
  "prompts": [
    {
      "assetType": "linkedin_header",
      "platform": "LinkedIn",
      "aspectRatio": "16:9",
      "prompt": "...",
      "negativePrompt": "..."
    },
    {
      "assetType": "instagram_carousel",
      "platform": "Instagram",
      "aspectRatio": "4:5",
      "prompt": "...",
      "negativePrompt": "..."
    }
  ]
}
`;

  const result = await generateText(prompt);

  try {
    return JSON.parse(result) as VisualPromptBundle;
  } catch {
    console.error("Could not parse visual prompts JSON:");
    console.error(result);
    throw new Error("Failed to parse visual prompts JSON");
  }
}