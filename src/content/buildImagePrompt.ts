import type { ContentIdea, Platform } from "./types";

export function buildImagePrompt(
  idea: ContentIdea,
  platform: Platform,
): string {
  const aspectRatio =
    platform === "Instagram"
      ? "4:5 portrait composition suitable for an Instagram feed post"
      : "4:5 portrait composition suitable for a LinkedIn feed post";

  return `
Create a polished social media illustration for Eddy, an AI-powered learning product for school students.

CORE IDEA:
${idea.visualConcept ?? idea.angle}

MESSAGE TO COMMUNICATE:
${idea.title}

AUDIENCE:
${idea.audience}

PURPOSE:
${idea.objective.replaceAll("_", " ").toLowerCase()}

VISUAL DIRECTION:
- Modern editorial illustration
- Intelligent, warm and educational
- Simple composition with one immediately understandable visual metaphor
- Visually interesting without looking childish
- Premium education-technology brand aesthetic
- Avoid generic corporate stock imagery
- Avoid overly futuristic AI imagery, robots, glowing brains or cliché circuitry
- Use restrained visual detail so the central idea is immediately clear
- Suitable for a professional social media feed

BRAND DIRECTION:
- Eddy brand palette can use deep blue and lighter blue accents
- Prefer clean neutral backgrounds
- Sophisticated but approachable
- Modern typography only if text is absolutely necessary

COMPOSITION:
- ${aspectRatio}
- Strong visual hierarchy
- Main subject clearly visible even on a mobile screen
- Leave breathing room around the key subject
- Avoid important elements close to the edges

TEXT:
- Do not add paragraphs or explanatory copy inside the image
- Prefer no text unless a very short phrase materially improves the concept
- Never invent logos, statistics or factual claims

OUTPUT:
Create one finished social-media-ready image with no watermark, no mockup frame and no UI surrounding it.
`.trim();
}
