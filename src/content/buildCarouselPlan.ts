import type { ContentIdea, Platform } from "./types";

export type CarouselPlan = {
  slides: string[];
  visualBrief: string;
};

export function buildCarouselPlan(
  idea: ContentIdea,
  platform: Platform,
): CarouselPlan {
  const slides = [
    idea.title,

    `The problem:\n${idea.angle}`,

    `Why this matters:\n${idea.whyItMatters}`,

    "Better learning is not about doing more. It is about getting the right guidance at the right time.",

    "Learning should adapt to the student — not the other way around.",
  ];

  const visualBrief = `
Create a cohesive ${slides.length}-slide educational carousel for Eddy.

Platform: ${platform}

Core topic:
${idea.title}

Overall concept:
${idea.visualConcept ?? idea.angle}

Visual direction:
- Clean editorial education-tech aesthetic
- Consistent visual system across every slide
- Strong hierarchy and generous whitespace
- Designed primarily for mobile viewing
- Clear, readable headlines
- Minimal text per slide
- Use deep blue and lighter blue accents consistent with Eddy
- Warm, intelligent and approachable
- Avoid childish classroom graphics
- Avoid generic corporate stock imagery
- Avoid cliché AI robots, glowing brains or circuitry
- Every slide should feel like part of the same visual story

Narrative flow:
1. Strong hook
2. Explain the problem
3. Explain why it matters
4. Present the key insight
5. End with the main takeaway

Do not invent statistics, quotes or claims that are not supplied.
`.trim();

  return {
    slides,
    visualBrief,
  };
}
