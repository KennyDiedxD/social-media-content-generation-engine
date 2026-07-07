import { generateText } from "../llm/llmClient";
import type { CoreContext } from "./loadContext";
import type { ContentIdea } from "./generateIdeas";

export type CampaignBlueprint = {
  ideaTitle: string;
  humanObservation: string;
  parentTension: string;
  commonMistake: string;
  sharperInsight: string;
  concreteExample: string;
  eddyPointOfView: string;
  avoidAngles: string[];
};

export async function generateBlueprint(
  idea: ContentIdea,
  context: CoreContext
): Promise<CampaignBlueprint> {
  const prompt = `
You are Eddy's content thinker.

Turn the idea into a simple human insight that a thoughtful parent or teacher could recognize from real life.

Do not create a marketing campaign.
Do not force a metaphor.
Do not create a dramatic story arc.
Do not make it sound like brand strategy.

Do not write platform-specific content.
Do not mention LinkedIn, Instagram, reels, carousels, blogs, or newsletters.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanation.

Eddy Brand Brain:
${context.brandBrain}

Content Signals:
${JSON.stringify(context.signals, null, 2)}

Content Idea:
${JSON.stringify(idea, null, 2)}

Return JSON in this exact format:
{
  "ideaTitle": "...",
  "humanObservation": "...",
  "parentTension": "...",
  "commonMistake": "...",
  "sharperInsight": "...",
  "concreteExample": "...",
  "eddyPointOfView": "...",
  "avoidAngles": ["...", "...", "..."]
}
`;

  const result = await generateText(prompt);

  try {
    return JSON.parse(result) as CampaignBlueprint;
  } catch {
    console.error("Could not parse campaign blueprint JSON:");
    console.error(result);
    throw new Error("Failed to parse campaign blueprint JSON");
  }
}