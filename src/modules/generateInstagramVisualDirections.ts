import { generateText } from "../llm/llmClient";
import type { CoreContext } from "./loadContext";
import type { CampaignBlueprint } from "./generateBlueprint";
import type { InstagramCarousel } from "./generateInstagramCarousel";

export type InstagramVisualDirections = {
  slides: {
    slideNumber: number;
    visualDirection: string;
  }[];
};

export async function generateInstagramVisualDirections(
  carousel: InstagramCarousel,
  blueprint: CampaignBlueprint,
  context: CoreContext
): Promise<InstagramVisualDirections> {
  const prompt = `
You are Eddy's visual art director.

Your job is NOT to rewrite the carousel copy.

Read each slide and describe a visual direction that makes the slide easy to understand.

Rules:
- One visual concept per slide.
- Keep each visualDirection under 40 words.
- Maintain one consistent style across all six slides.
- Style: warm, modern, premium educational illustration.
- Use Indian home-study settings where natural.
- Think visual first, text second.
- Do not repeat the slide headline or body.
- Do not describe every sentence.
- Visuals should support the idea, not explain the whole post.

Avoid:
- dashboards
- charts
- report cards
- marks
- ranks
- trophies
- robots
- sci-fi
- corporate aesthetics
- stock-photo poses
- anxious or stressed children

Campaign Blueprint:
${JSON.stringify(blueprint, null, 2)}

Instagram Carousel:
${JSON.stringify(carousel, null, 2)}

Return ONLY valid JSON.
Do not include markdown.
Do not include explanation.

Return JSON in this exact format:
{
  "slides": [
    {
      "slideNumber": 1,
      "visualDirection": "..."
    }
  ]
}
`;

  const result = await generateText(prompt);

  try {
    return JSON.parse(result) as InstagramVisualDirections;
  } catch {
    console.error("Could not parse Instagram visual directions JSON:");
    console.error(result);
    throw new Error("Failed to parse Instagram visual directions JSON");
  }
}