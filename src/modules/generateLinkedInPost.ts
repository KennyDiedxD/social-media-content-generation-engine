import { generateText } from "../llm/llmClient";
import type { CoreContext } from "./loadContext";
import type { ContentIdea } from "./generateIdeas";
import type { CampaignBlueprint } from "./generateBlueprint";
import { linkedinConfig } from "../configs/linkedin";
import { loadPlatformContext } from "./loadContext";

export type LinkedInPost = {
  platform: "LinkedIn";
  format: "text_post";
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
};

export async function generateLinkedInPost(
  idea: ContentIdea,
  blueprint: CampaignBlueprint
): Promise<LinkedInPost> {
  const context = await loadPlatformContext("linkedin");
  const prompt = `
Write like a thoughtful founder/teacher sharing something they have noticed about how children study.

The post should sound like a real person wrote it after observing students and parents, not like a content marketing team wrote it. 

Authenticity rules:
- The blueprint is the source of truth.
- Do not replace its examples with new ones.
- Do not invent personal experiences.
- Do not write "I had a student...", "Yesterday I...", or similar first-person anecdotes unless that exact experience exists in the blueprint.
- If using an example, reuse the concreteExample from the blueprint or make it clearly hypothetical.
- This should feel like something someone genuinely wanted to share after noticing a pattern.
- It should not feel like it was written to teach, persuade, or go viral.
- Readers should feel they discovered an interesting observation, not that they finished a lesson.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanation.

Rules:
- The Brand Brain and LinkedIn Brain provide guidance, not a template.
- If they conflict with sounding natural, prioritize sounding like a thoughtful human.
- Language must be English.
- Do not use emojis.
- Stay under 150 words.
- Do not antagonize anyone.

Avoid:
- "The biggest shift..."
- "The key is..."
- "True learning..."
- "Effective guidance..."
- "In today's world..."
- "Ultimately..."
- overly neat three-part arguments
- consultant language
- motivational speaker tone
- textbook explanations
- using "—" in the text

Prefer:
- one concrete moment
- short sentences
- slightly imperfect human flow
- examples before abstractions
- simple parent language
- one clear point, not a full essay

Eddy Brand Brain:
${context.brandBrain}

Content Idea:
${JSON.stringify(idea, null, 2)}

Campaign Blueprint:
${JSON.stringify(blueprint, null, 2)}

LinkedIn Config:
${JSON.stringify(linkedinConfig, null, 2)}

Return JSON in this exact format:
{
  "platform": "LinkedIn",
  "format": "text_post",
  "hook": "...",
  "body": "...",
  "cta": "...",
  "hashtags": ["...", "..."]
}
`;

  const result = await generateText(prompt);

  try {
    return JSON.parse(result) as LinkedInPost;
  } catch {
    console.error("Could not parse LinkedIn post JSON:");
    console.error(result);
    throw new Error("Failed to parse LinkedIn post JSON");
  }
}