import { generateText } from "../llm/llmClient";
import type { EngineContext } from "./loadContext";

export type ContentIdea = {
  title: string;
  pillar: string;
  angle: string;
  audience: string;
  whyItMatters: string;
  suggestedPlatforms: string[];
};

export async function generateIdeas(
  context: EngineContext
): Promise<ContentIdea[]> {
  const prompt = `
You are Eddy's social media content strategist.

Your job is to generate 3 strong content ideas for Eddy.

Use the Eddy Brand Brain and Content Signals below.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanation.

Generate exactly 3 content ideas.

Each idea must be strong enough to turn into social media drafts immediately.

Each idea must have:
- title
- pillar
- angle
- audience
- whyItMatters
- suggestedPlatforms

Eddy Brand Brain:
${context.brandBrain}

Content Signals:
${JSON.stringify(context.signals, null, 2)}

JSON format:
[
  {
    "title": "...",
    "pillar": "...",
    "angle": "...",
    "audience": "...",
    "whyItMatters": "...",
    "suggestedPlatforms": ["LinkedIn", "Instagram"]
  }
]
`;

  const result = await generateText(prompt);

  try {
    return JSON.parse(result) as ContentIdea[];
  } catch {
    console.error("Could not parse Gemma response as JSON:");
    console.error(result);
    throw new Error("Failed to parse generated ideas JSON");
  }
}