import { generateText } from "../llm/llmClient";
import type { CoreContext } from "./loadContext";
import type { CampaignBrief } from "./loadCampaignBrief";

export type ContentIdea = {
  title: string;
  pillar: string;
  angle: string;
  audience: string;
  whyItMatters: string;
  suggestedPlatforms: string[];
};

export async function generateIdeas(
  context: CoreContext,
  brief?: CampaignBrief
): Promise<ContentIdea[]> {
  const ideaCount = brief?.outputs?.ideas ?? 3;

  const briefBlock = brief
    ? `
Campaign Brief:
${JSON.stringify(brief, null, 2)}

When a Campaign Brief is provided:
- The Campaign Brief is the primary source of direction.
- The Brand Brain defines Eddy's voice.
- Content Signals provide supporting context.
- If there is a conflict, prioritize the Campaign Brief.
- Respect mustInclude and mustAvoid.
- Use the tone, audience, goal, referenceNotes, and exampleMoment.
`
    : `
No Campaign Brief was supplied.

Choose themes, audience, and tone autonomously using the Brand Brain, Creative Brain, and Content Signals.
`;

  const prompt = `
You are Eddy's social media content strategist.

Your job is to generate ${ideaCount} strong content ideas for Eddy.

Use the Eddy Brand Brain and Content Signals below.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanation.

Generate exactly ${ideaCount} content ideas.

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

${briefBlock}

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