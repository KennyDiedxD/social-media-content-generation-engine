import { config } from "../config";
import { generateText } from "../llm/llmClient";

import type { ContentIdea, ContentRequest } from "./types";
import type { ContentArchetype } from "./structured/types";
import type { EngineContext } from "../context/types";

type AIContentIdea = {
  title: string;
  pillar: string;
  angle: string;
  audience: string;
  whyItMatters: string;

  archetype: ContentArchetype;

  visualConcept?: string | null;
};

const CONTENT_ARCHETYPES: ContentArchetype[] = [
  "INSIGHT_REFRAME",
  "STRUCTURED_LIST",
  "SEQUENCE",
  "CONTRAST",
  "PROBLEM_BETTER_WAY",
  "FRAMEWORK_MODEL",
  "EXPLAINER_QA",
  "EVIDENCE_DATA_STORY",
  "STORY_CASE",
  "INTERACTIVE_SWIPE",
  "MEME_RELATABLE",
  "SOCIAL_TEXT_COMMENTARY",
];

function isContentArchetype(value: unknown): value is ContentArchetype {
  return (
    typeof value === "string" &&
    CONTENT_ARCHETYPES.includes(value as ContentArchetype)
  );
}

function isValidIdea(value: unknown): value is AIContentIdea {
  if (!value || typeof value !== "object") {
    return false;
  }

  const idea = value as Record<string, unknown>;

  return (
    typeof idea.title === "string" &&
    typeof idea.pillar === "string" &&
    typeof idea.angle === "string" &&
    typeof idea.audience === "string" &&
    typeof idea.whyItMatters === "string" &&
    isContentArchetype(idea.archetype)
  );
}

export async function generateIdeas(
  context: EngineContext,
  request: ContentRequest,
): Promise<ContentIdea[]> {
  console.log("Content request:", request);

  /*
   * Keep the existing mock behaviour available
   * if AI is disabled.
   */
  if (!config.useLLM) {
    const baseIdeas = [
      {
        title: "Most AI tutors wait. Children need guidance.",
        pillar: "AI Tutor Myths",
        angle:
          "Contrast reactive answer engines with learning systems that actively guide the student.",
        audience: "Parents",
        whyItMatters:
          "Parents need to understand why simply answering questions is not the same as teaching.",
        archetype: "INSIGHT_REFRAME" as const,
      },
      {
        title: "Studying longer is not the same as learning better.",
        pillar: "Learning How to Learn",
        angle:
          "Challenge the assumption that more study time automatically means more learning.",
        audience: "Parents",
        whyItMatters:
          "Parents often measure effort through time rather than actual understanding.",
        archetype: "INSIGHT_REFRAME" as const,
      },
      {
        title: "Marks are a late signal.",
        pillar: "Parent Visibility",
        angle:
          "Show why parents need visibility into learning gaps before they appear in exam results.",
        audience: "Parents",
        whyItMatters:
          "By the time marks fall, the underlying learning problem may have existed for weeks.",
        archetype: "INSIGHT_REFRAME" as const,
      },
    ];

    return baseIdeas.map((idea) => ({
      ...idea,

      archetype: request.archetype ?? idea.archetype,

      suggestedPlatforms: request.platforms,
      postKind: request.postKind,
      objective: request.objective,

      signalIds: request.signalIds ?? [],

      visualConcept:
        request.postKind === "TEXT"
          ? undefined
          : `${idea.title} represented through one clear, modern educational visual metaphor.`,
    }));
  }

  const inspiration =
    context.signals.length > 0
      ? JSON.stringify(context.signals, null, 2)
      : "No additional inspiration was supplied.";

  const prompt = `
You are the content strategist for Eddy, an AI learning product.

Your job is to generate exactly 3 strong and clearly differentiated social-media content ideas.

Use the Eddy Brand Brain as the primary source of brand positioning, beliefs, audience and messaging.

If CURRENT INSPIRATION is provided, use it as the subject, trigger, evidence, or creative starting point for the ideas. Do not blindly repeat it.

Do not invent facts, statistics, research findings, product capabilities or customer claims that are not supported by the supplied context.

CONTENT REQUEST

Platforms:
${request.platforms.join(", ")}

Post format:
${request.postKind}

Objective:
${request.objective}

Content archetype:
${request.archetype ?? "AUTO"}

EDDY BRAND BRAIN

${context.brandBrain}

CURRENT INSPIRATION

${inspiration}

REQUIREMENTS

Generate exactly 3 ideas.

${
  request.archetype
    ? `
CONTENT ARCHETYPE IS FIXED

All 3 ideas MUST use exactly this archetype:

${request.archetype}

Do not select another archetype.
The three ideas should still explore meaningfully different angles.
`
    : `
CONTENT ARCHETYPE IS AUTO

Choose the most appropriate archetype for each idea from the allowed archetypes below.
`
}

When CURRENT INSPIRATION is provided:

- ALL 3 ideas must be materially derived from that inspiration.
- Do not generate unrelated generic Eddy ideas.
- Each idea should explore a DIFFERENT angle on the same inspiration.
- The connection to the inspiration must be obvious from the title, angle, or whyItMatters.
- The three ideas should not merely repeat the same framing.

Think of it as:

Idea 1 = one interpretation of the inspiration
Idea 2 = a different interpretation of the inspiration
Idea 3 = another useful interpretation of the inspiration

The Eddy Brand Brain should shape the perspective and tone, but it must not replace the supplied inspiration as the subject.

The ideas should:
- be meaningfully different from each other
- fit Eddy's positioning
- be useful to the requested audience
- fit the requested objective
- be strong enough to turn directly into a social post
- avoid generic EdTech language
- avoid exaggerated marketing claims

CONTENT ARCHETYPE

Choose exactly ONE archetype for each idea:

INSIGHT_REFRAME
- one sharp proposition or change in perspective

STRUCTURED_LIST
- 3+ independent points that can be reordered

SEQUENCE
- ordered steps or stages where order matters

CONTRAST
- understanding depends on comparing A vs B

PROBLEM_BETTER_WAY
- recognizable pain → cause → better approach

FRAMEWORK_MODEL
- components, levels, dimensions, axes, or relationships

EXPLAINER_QA
- primarily answers a what / why / how question

EVIDENCE_DATA_STORY
- evidence, research, or a statistic is the central story

STORY_CASE
- a person/scenario progressing through a situation carries the idea

INTERACTIVE_SWIPE
- the swipe/reveal interaction is necessary to the meaning

MEME_RELATABLE
- humour and recognition are the primary value

SOCIAL_TEXT_COMMENTARY
- short verbal observation or conversational commentary

Choose the simplest archetype that accurately fits the idea.

Do not choose INTERACTIVE_SWIPE merely because the requested format is CAROUSEL.

For IMAGE or CAROUSEL posts, include a strong visualConcept.

For TEXT posts, visualConcept is optional.

Return ONLY valid JSON.

Required JSON structure:

{
  "ideas": [
    {
  "title": "...",
  "pillar": "...",
  "angle": "...",
  "audience": "...",
  "whyItMatters": "...",
  "archetype": "INSIGHT_REFRAME",
  "visualConcept": null
}
  ]
}

The "ideas" array must contain exactly 3 ideas.

For TEXT posts, visualConcept may be null.
For IMAGE or CAROUSEL posts, visualConcept should be a string.
`;

  let ideas: AIContentIdea[] | undefined;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const attemptPrompt =
      attempt === 1
        ? prompt
        : `${prompt}

IMPORTANT JSON CORRECTION:

Your previous response was invalid or did not match the required structure.

Return the COMPLETE response again as strict valid JSON only.

Rules:
- No markdown.
- No code fences.
- No text before or after the JSON.
- Return an object containing an "ideas" array.
- The "ideas" array must contain exactly 3 ideas.
- Every idea must contain:
  - archetype 
  - title
  - pillar
  - angle
  - audience
  - whyItMatters
- archetype must be exactly one of:
  INSIGHT_REFRAME
  STRUCTURED_LIST
  SEQUENCE
  CONTRAST
  PROBLEM_BETTER_WAY
  FRAMEWORK_MODEL
  EXPLAINER_QA
  EVIDENCE_DATA_STORY
  STORY_CASE
  INTERACTIVE_SWIPE
  MEME_RELATABLE
  SOCIAL_TEXT_COMMENTARY
- Escape quotation marks correctly.
- Close every array and object correctly.
${
  request.archetype
    ? `- Every idea must have "archetype": "${request.archetype}".`
    : "- archetype must be one of the allowed canonical archetypes."
}
`;

    const result = await generateText(attemptPrompt, {
      json: true,
      temperature: attempt === 1 ? 0.7 : 0.2,
    });

    let parsed: unknown;

    try {
      parsed = JSON.parse(result);
    } catch {
      console.warn(`Invalid idea JSON from AI — attempt ${attempt}/3`);

      console.warn("Raw AI response:", result);

      if (attempt === 3) {
        throw new Error(
          "AI returned invalid JSON while generating ideas after 3 attempts",
        );
      }

      continue;
    }

    let candidateIdeas: unknown[] | undefined;
    if (Array.isArray(parsed)) {
      // Keep backward compatibility with a bare array.
      candidateIdeas = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { ideas?: unknown }).ideas)
    ) {
      candidateIdeas = (parsed as { ideas: unknown[] }).ideas;
    } else {
      console.warn(
        `Invalid idea structure from AI — attempt ${attempt}/3`,
        parsed,
      );

      if (attempt === 3) {
        throw new Error(
          "AI returned an invalid content idea structure after 3 attempts",
        );
      }

      continue;
    }

    const validIdeas =
      candidateIdeas.length === 3 && candidateIdeas.every(isValidIdea);

    const matchesRequestedArchetype =
      !request.archetype ||
      candidateIdeas.every(
        (idea) => isValidIdea(idea) && idea.archetype === request.archetype,
      );

    if (!validIdeas || !matchesRequestedArchetype) {
      console.warn(
        `Invalid ideas from AI — attempt ${attempt}/3`,
        candidateIdeas,
      );

      if (attempt === 3) {
        throw new Error("AI returned invalid content ideas after 3 attempts");
      }

      continue;
    }

    ideas = candidateIdeas as AIContentIdea[];
    break;
  }

  if (!ideas) {
    throw new Error("AI failed to generate valid content ideas");
  }

  return ideas.map((idea) => ({
    title: idea.title,
    pillar: idea.pillar,
    angle: idea.angle,
    audience: idea.audience,
    whyItMatters: idea.whyItMatters,
    archetype: idea.archetype,

    suggestedPlatforms: request.platforms,

    postKind: request.postKind,
    objective: request.objective,

    signalIds: request.signalIds ?? [],

    visualConcept:
      request.postKind === "TEXT"
        ? (idea.visualConcept ?? undefined)
        : (idea.visualConcept ??
          `${idea.title} represented through one clear educational visual metaphor.`),
  }));
}
