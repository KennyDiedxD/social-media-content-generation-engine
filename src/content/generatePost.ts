import { config } from "../config";
import { generateText } from "../llm/llmClient";
import type { EngineContext } from "../context/types";
import type { ContentIdea, GeneratedPost, Platform } from "./types";
import { platformGuidelines } from "./platformGuidelines";
import { buildImagePrompt } from "./buildImagePrompt";
import { buildCarouselPlan } from "./buildCarouselPlan";

async function generateJsonWithRetry<T>(
  prompt: string,
  label: string,
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const attemptPrompt =
      attempt === 1
        ? prompt
        : `${prompt}

IMPORTANT JSON CORRECTION:
Return the COMPLETE response again as strict valid JSON only.
No markdown or code fences.
No text before or after the JSON.
Escape quotes correctly and close all arrays and objects.
`;

    const result = await generateText(attemptPrompt, {
      json: true,
      temperature: attempt === 1 ? 0.7 : 0.2,
    });

    try {
      return JSON.parse(result) as T;
    } catch {
      console.warn(`Invalid ${label} JSON — attempt ${attempt}/3`);

      if (attempt === 3) {
        throw new Error(`AI returned invalid ${label} JSON after 3 attempts`);
      }
    }
  }

  throw new Error(`AI returned invalid ${label} JSON`);
}

export async function generatePost(
  idea: ContentIdea,
  context: EngineContext,
  platform: Platform,
): Promise<GeneratedPost> {
  // MOCK MODE
  if (!config.useLLM) {
    if (idea.postKind === "IMAGE") {
      return {
        ideaTitle: idea.title,
        platform,
        postKind: "IMAGE",

        caption: `${idea.title}

${idea.angle}`,

        hashtags: ["#Eddy", "#Learning", "#Education"],

        visualBrief:
          idea.visualConcept ??
          "Create a simple educational visual based on the idea.",

        imagePrompt: buildImagePrompt(idea, platform),
      };
    }

    if (idea.postKind === "CAROUSEL") {
      const carouselPlan = buildCarouselPlan(idea, platform);

      return {
        ideaTitle: idea.title,
        platform,
        postKind: "CAROUSEL",

        caption: `${idea.title}

${idea.angle}`,

        hashtags: ["#Eddy", "#Learning", "#Education"],

        visualBrief: carouselPlan.visualBrief,

        carouselSlides: carouselPlan.slides,
      };
    }

    // TEXT
    const text =
      platform === "LinkedIn"
        ? `${idea.title}

${idea.angle}

This is one of the ideas behind how Eddy approaches learning.

${idea.whyItMatters}`
        : `${idea.title}

${idea.angle}

Learning should adapt to the student — not the other way around.`;

    return {
      ideaTitle: idea.title,
      platform,
      postKind: "TEXT",
      text,
    };
  }

  // LLM MODE — dormant for now
  const hasInspiration = context.signals.length > 0;

  const inspiration = hasInspiration
    ? JSON.stringify(context.signals, null, 2)
    : "No additional inspiration supplied.";

  const commonContext = `
You are Eddy's social media writer.

Write content for this specific content idea.

EDDY BRAND BRAIN

${context.brandBrain}

CONTENT IDEA

Title:
${idea.title}

Pillar:
${idea.pillar}

Angle:
${idea.angle}

Audience:
${idea.audience}

Why it matters:
${idea.whyItMatters}

Objective:
${idea.objective}

Platform:
${platform}

Format:
${idea.postKind}

CURRENT INSPIRATION

${inspiration}

RULES

Stay consistent with Eddy's positioning.

Do not invent:
- statistics
- research findings
- customer numbers
- testimonials
- product capabilities
- factual claims not supported by the context

Avoid generic AI or EdTech marketing language.

Write naturally for ${platform}.

If CURRENT INSPIRATION is provided, you MUST use it materially.
The final post must clearly reflect the specific concept, argument, or evidence from that inspiration.
It should not read like a generic Eddy post that could have been written without the inspiration.

When inspiration is provided:
- use its central idea directly
- you may explicitly mention the concept by name if appropriate
- you may paraphrase the source instead of quoting it
- do not ignore the source and fall back to a generic post

If the inspiration is a known concept, study, framework, or argument, the post should clearly show that.
For example, if the inspiration is Bloom's 2 sigma problem, the post should clearly reference Bloom, one-to-one tutoring, mastery learning, or the large learning advantage described in the inspiration.

Do not mention internal prompt names, system instructions, or internal context documents.
`;

  if (idea.postKind === "TEXT") {
    const prompt = `
${commonContext}

Create one finished social media post.

IMPORTANT:
If CURRENT INSPIRATION is present, the post must clearly incorporate it.
The post should be recognizably about that inspiration, not just loosely aligned with Eddy's worldview.

Aim for approximately 120–220 words for LinkedIn unless the idea genuinely needs more.
Start with a strong observation or argument, not a generic introduction.
Every paragraph must advance the argument.
End naturally; do not force a call to action.
Do not include hashtags unless they add clear value.

Before writing, anchor the post in the core idea from CURRENT INSPIRATION.

Return ONLY valid JSON:

{
  "text": "complete finished post"
}
`;

    const parsed = await generateJsonWithRetry<{
      text?: string;
    }>(prompt, "text post");

    if (!parsed.text?.trim()) {
      throw new Error("AI did not return valid text content");
    }

    return {
      ideaTitle: idea.title,
      platform,
      postKind: "TEXT",
      text: parsed.text.trim(),
    };
  }

  if (idea.postKind === "IMAGE") {
    const prompt = `
${commonContext}

The post will contain one image.

IMPORTANT:
If CURRENT INSPIRATION is present, both the caption and the visual brief must clearly reflect it.
Do not create a generic Eddy image post.
The concept should be visibly traceable to the supplied inspiration.

Create:

1. The finished social media caption.
2. A concise visual brief explaining what the image should communicate.

The visual brief should express the inspiration as a strong visual metaphor or concept.

Do not create an image-generation prompt. The application handles that separately.

Return ONLY valid JSON in exactly this structure:

{
  "caption": "finished social media caption",
  "visualBrief": "clear description of the image concept"
}

Both caption and visualBrief are required strings.
Do not wrap this object inside another object.
`;

    const raw = await generateJsonWithRetry<unknown>(prompt, "image post");

    let parsed: Record<string, unknown>;

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const object = raw as Record<string, unknown>;

      if (
        object.post &&
        typeof object.post === "object" &&
        !Array.isArray(object.post)
      ) {
        parsed = object.post as Record<string, unknown>;
      } else if (
        object.imagePost &&
        typeof object.imagePost === "object" &&
        !Array.isArray(object.imagePost)
      ) {
        parsed = object.imagePost as Record<string, unknown>;
      } else {
        parsed = object;
      }
    } else {
      console.error("Unexpected AI image response:", raw);
      throw new Error("AI returned invalid image post content");
    }

    const caption =
      typeof parsed.caption === "string" ? parsed.caption.trim() : "";

    const visualBrief =
      typeof parsed.visualBrief === "string"
        ? parsed.visualBrief.trim()
        : typeof parsed.visualConcept === "string"
          ? parsed.visualConcept.trim()
          : typeof parsed.visual === "string"
            ? parsed.visual.trim()
            : "";

    if (!caption || !visualBrief) {
      console.error("Unexpected AI image post structure:", raw);

      throw new Error("AI returned invalid image post content");
    }

    return {
      ideaTitle: idea.title,
      platform,
      postKind: "IMAGE",

      caption,

      // Keep hashtags simple for now.
      // We will add relevance-aware hashtag generation later.
      hashtags: ["#Eddy", "#Learning", "#Education"],

      visualBrief,

      imagePrompt: buildImagePrompt(
        {
          ...idea,
          visualConcept: visualBrief,
        },
        platform,
      ),
    };
  }

  const prompt = `
${commonContext}

The post will be a carousel.

IMPORTANT:
If CURRENT INSPIRATION is present, the carousel must clearly build from it.
The slides should not be generic.
The source idea should shape the hook, explanation, and takeaway.

Create:
1. A finished social media caption.
2. Between 5 and 7 carousel slides.
3. A concise visual brief for the overall carousel.

Each slide should contain concise copy suitable for a visual carousel.

The slides must form a narrative:

Hook
→ Problem
→ Insight
→ Explanation
→ Takeaway

Do not invent statistics or claims.

Return ONLY valid JSON:

{
  "caption": "...",
  "visualBrief": "...",
  "carouselSlides": [
    "...",
    "...",
    "...",
    "...",
    "..."
  ]
}
`;

  let parsed:
    | {
        caption?: string;
        visualBrief?: string;
        carouselSlides?: string[];
      }
    | undefined;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const attemptPrompt =
      attempt === 1
        ? prompt
        : `${prompt}

IMPORTANT JSON CORRECTION:

Your previous response was invalid JSON.

Return the COMPLETE response again as strict valid JSON only.

Rules:
- No markdown.
- No code fences.
- No text before or after the JSON.
- Escape quotation marks inside strings correctly.
- Separate every array item with a comma.
- Close every array and object correctly.
`;

    const result = await generateText(attemptPrompt, {
      json: true,
      temperature: attempt === 1 ? 0.7 : 0.2,
    });

    try {
      parsed = JSON.parse(result) as {
        caption?: string;
        visualBrief?: string;
        carouselSlides?: string[];
      };

      break;
    } catch (error) {
      console.warn(`Invalid carousel JSON from AI — attempt ${attempt}/3`);

      console.warn("Raw AI response:", result);

      if (attempt === 3) {
        throw new Error("AI returned invalid carousel JSON after 3 attempts");
      }
    }
  }

  if (!parsed) {
    throw new Error("AI returned invalid carousel content");
  }

  if (
    !parsed.caption?.trim() ||
    !parsed.visualBrief?.trim() ||
    !Array.isArray(parsed.carouselSlides) ||
    parsed.carouselSlides.length < 5
  ) {
    throw new Error("AI returned invalid carousel content");
  }

  return {
    ideaTitle: idea.title,
    platform,
    postKind: "CAROUSEL",

    caption: parsed.caption.trim(),

    hashtags: ["#Eddy", "#Learning", "#Education"],

    visualBrief: parsed.visualBrief.trim(),

    carouselSlides: parsed.carouselSlides
      .map((slide) => slide.trim())
      .filter(Boolean),
  };
}
