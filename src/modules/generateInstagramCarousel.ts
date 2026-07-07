import { generateText } from "../llm/llmClient";
import type { CoreContext } from "./loadContext";
import type { ContentIdea } from "./generateIdeas";
import type { CampaignBlueprint } from "./generateBlueprint";
import { instagramCarouselConfig } from "../configs/instagramCarousel";
import { loadPlatformContext } from "./loadContext";

export type InstagramCarousel = {
  platform: "Instagram";
  format: "carousel";
  slideCount: number;
  slides: {
    slideNumber: number;
    headline: string;
    body: string;
    visualDirection: string;
  }[];
  caption: string;
  hashtags: string[];
};

export async function generateInstagramCarousel(
  idea: ContentIdea,
  blueprint: CampaignBlueprint
): Promise<InstagramCarousel> {
  const context = await loadPlatformContext("instagram-carousel");
  const prompt = `
You are helping Eddy's founder write Instagram carousel copy.

Objective

Create a 6-slide Instagram carousel that makes parents recognize something from real life.

The carousel should feel like a sequence of simple observations, not a presentation, lesson, or sales deck.

Each slide should communicate exactly one idea.

Authenticity

- The Campaign Blueprint is the source of truth.
- Expand the ideas already present in the blueprint.
- Do not invent personal stories.
- If using an example, reuse the blueprint's concreteExample or make it clearly hypothetical.
- Do not optimize for virality.
- Do not try to sound profound or inspirational.

Writing Style

- Write like a thoughtful educator or founder talking to parents.
- Use simple, conversational English.
- Prefer things parents notice at home.
- Prefer concrete moments over abstract claims.
- Trust the reader to connect the dots.
- Do not define educational concepts unless absolutely necessary.
- One idea per slide.
- Keep headlines short.
- Keep body text light.

Carousel Flow

Slide 1: Create curiosity.
Slide 2: Show a familiar parent-child study moment.
Slide 3: Challenge the obvious interpretation of that moment.
Slide 4: Offer a better way to notice what is happening.
Slide 5: Connect softly to Eddy's point of view.
Slide 6: Leave the reader with one simple thought.

Rules

- The Brand Brain and Instagram Carousel Brain provide guidance, not a template.
- If they conflict with sounding natural, prioritize sounding like a thoughtful human.
- Language must be English.
- Generate exactly 6 slides.
- Do not use Hindi or Hinglish.
- Do not use emojis.
- Do not write visual directions yet. For visualDirection, return an empty string.

Never

- Write like a PowerPoint presentation.
- Use chapter-heading slide titles.
- Explain educational theory.
- Use words like metacognition, agency, scaffolding, friction point, mastery, unless they are absolutely necessary.
- Use consultant language.
- Use motivational speaker language.
- Force a lesson on every slide.
- Over-explain.
- Repeat the same point across multiple slides.

Content Limits

- Headlines should be under 8 words.
- Body text should be under 30 words.
- Caption should be under 80 words.

Eddy Brand Brain:
${context.brandBrain}

Content Idea:
${JSON.stringify(idea, null, 2)}

Campaign Blueprint:
${JSON.stringify(blueprint, null, 2)}

Instagram Carousel Config:
${JSON.stringify(instagramCarouselConfig, null, 2)}

Return ONLY valid JSON.
Do not include markdown.
Do not include explanation.

Return JSON in this exact format:
{
  "platform": "Instagram",
  "format": "carousel",
  "slideCount": 6,
  "slides": [
    {
      "slideNumber": 1,
      "headline": "...",
      "body": "...",
      "visualDirection": ""
    }
  ],
  "caption": "...",
  "hashtags": ["...", "..."]
}
`;

  const result = await generateText(prompt);

  try {
    return JSON.parse(result) as InstagramCarousel;
  } catch {
    console.error("Could not parse Instagram carousel JSON:");
    console.error(result);
    throw new Error("Failed to parse Instagram carousel JSON");
  }
}