import { generateText } from "../../llm/llmClient";

import type { EngineContext } from "../../context/types";
import type { ContentIdea, Platform } from "../types";

import { getArchetypeRecipe } from "./archetypes";

import { getVisualTemplate } from "./templates";

import type {
  ArchetypeRecipe,
  ArchetypeSlideRecipe,
  ContentArchetype,
  ImageZone,
  SlideContent,
  SlideVisualAsset,
  StructuredGeneratedPost,
  TemplateField,
  VisualTemplateDefinition,
} from "./types";

type AIVisualAsset = {
  imageZoneId?: unknown;
  brief?: unknown;
};

type AIPlannedSlide = {
  slideNumber: number;

  fields: Record<string, unknown>;

  visualAssets?: unknown;

  /**
   * Temporary detection of the old response shape.
   * We no longer generate this field.
   */
  visualAssetBrief?: unknown;
};

type AIStructuredPost = {
  caption?: unknown;

  hashtags?: unknown;

  slides?: unknown;
};

type ValidatedAIStructuredPost = {
  caption: string;

  hashtags?: unknown;

  slides: unknown[];
};

type ResolvedSlideRecipe = {
  slideNumber: number;

  recipe: ArchetypeSlideRecipe;

  template: VisualTemplateDefinition;

  backgroundVariant?: string;

  /**
   * Image zones applicable to this slide's
   * selected asset mode and background variant.
   */
  activeImageZones: ImageZone[];
};

// ============================================================
// ARCHETYPE GUIDANCE
// ============================================================

function getArchetypeGuidance(archetype: ContentArchetype): string {
  switch (archetype) {
    case "INSIGHT_REFRAME":
      return `
INSIGHT_REFRAME

The post should move through one clear change in perspective.

The reader should move from:
a familiar assumption
→ a sharper way of seeing the issue
→ a useful final implication.

Do not turn this into a list, step-by-step guide,
generic explainer, or product pitch.

Each slide must advance the reframe rather than
repeat the previous slide.
`;

    default:
      throw new Error(
        `Structured generation is not yet implemented for ${archetype}`,
      );
  }
}

// ============================================================
// TEMPLATE CONTRACTS
// ============================================================

function formatFieldLimit(
  field: TemplateField,
  template: VisualTemplateDefinition,
): string {
  const limit = template.fieldLimits[field];

  if (!limit) {
    return field;
  }

  const constraints: string[] = [];

  if (limit.minWords !== undefined) {
    constraints.push(`min ${limit.minWords} words`);
  }

  if (limit.maxWords !== undefined) {
    constraints.push(`max ${limit.maxWords} words`);
  }

  if (limit.maxCharacters !== undefined) {
    constraints.push(`max ${limit.maxCharacters} characters`);
  }

  if (limit.maxLines !== undefined) {
    constraints.push(`max ${limit.maxLines} rendered lines`);
  }

  if (constraints.length === 0) {
    return field;
  }

  return `${field}: ${constraints.join(", ")}`;
}

function resolveRecipe(
  archetype: ContentArchetype,
  recipe: ArchetypeRecipe,
): ResolvedSlideRecipe[] {
  return recipe.slides.map((slideRecipe, index) => {
    const slideNumber = index + 1;

    const template = getVisualTemplate(slideRecipe.templateId);

    if (!template.supportedArchetypes.includes(archetype)) {
      throw new Error(
        `${template.templateId} does not support archetype ${archetype}`,
      );
    }

    if (!template.supportedNarrativeRoles.includes(slideRecipe.narrativeRole)) {
      throw new Error(
        `${template.templateId} does not support narrative role ${slideRecipe.narrativeRole}`,
      );
    }

    if (!template.supportedAssetModes.includes(slideRecipe.visualAssetMode)) {
      throw new Error(
        `${template.templateId} does not support asset mode ${slideRecipe.visualAssetMode}`,
      );
    }

    const followupIndex = index - 1;

    const backgroundVariant =
      followupIndex >= 0 && template.backgroundVariantSequence?.length
        ? template.backgroundVariantSequence[
            followupIndex % template.backgroundVariantSequence.length
          ]
        : undefined;

    let imageZones = template.imageZones;

    if (backgroundVariant) {
      const variant = template.backgroundVariants?.find(
        (candidate) => candidate.id === backgroundVariant,
      );

      if (!variant) {
        throw new Error(
          `Background variant "${backgroundVariant}" was not found on ${template.templateId}`,
        );
      }

      imageZones = variant.imageZones ?? imageZones;
    }

    const visualAssetMode = slideRecipe.visualAssetMode;

    let activeImageZones: ImageZone[] = [];

    if (visualAssetMode !== "NONE") {
      activeImageZones = imageZones.filter((zone) =>
        zone.allowedAssetModes.includes(visualAssetMode),
      );

      if (activeImageZones.length === 0) {
        throw new Error(
          `${template.templateId} requires visual asset mode ${visualAssetMode} but has no compatible image zone`,
        );
      }
    }

    return {
      slideNumber,
      recipe: slideRecipe,
      template,
      backgroundVariant,
      activeImageZones,
    };
  });
}

function buildTemplateContract(resolvedSlide: ResolvedSlideRecipe): string {
  const { slideNumber, recipe, template, activeImageZones } = resolvedSlide;
  const required = template.requiredFields.map((field) =>
    formatFieldLimit(field, template),
  );

  const optional = template.optionalFields.map((field) =>
    formatFieldLimit(field, template),
  );

  return `
Slide ${slideNumber}

Narrative role:
${recipe.narrativeRole}

Visual template:
${recipe.templateId}

Generated visual asset:
${recipe.visualAssetMode}

REQUIRED FIELDS
${
  required.length > 0
    ? required.map((field) => `- ${field}`).join("\n")
    : "- none"
}

OPTIONAL FIELDS
${
  optional.length > 0
    ? optional.map((field) => `- ${field}`).join("\n")
    : "- none"
}

VISUAL ASSET ZONES
${
  recipe.visualAssetMode === "NONE"
    ? "- none"
    : activeImageZones
        .map(
          (zone) =>
            `- ${zone.id}: return one semantic brief for the isolated visual only`,
        )
        .join("\n")
}
`;
}

// ============================================================
// RESPONSE VALIDATION
// ============================================================

function hasStringValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseSlideFields(
  aiSlide: AIPlannedSlide,
  resolvedSlide: ResolvedSlideRecipe,
): Partial<Record<TemplateField, string>> {
  const { slideNumber, template } = resolvedSlide;

  if (
    !aiSlide.fields ||
    typeof aiSlide.fields !== "object" ||
    Array.isArray(aiSlide.fields)
  ) {
    throw new Error(`Slide ${slideNumber} has invalid fields`);
  }

  const legalFields = new Set<TemplateField>([
    ...template.requiredFields,
    ...template.optionalFields,
  ]);

  const parsedFields: Partial<Record<TemplateField, string>> = {};

  for (const [field, value] of Object.entries(aiSlide.fields)) {
    if (!legalFields.has(field as TemplateField)) {
      throw new Error(
        `AI returned illegal field "${field}" for ${template.templateId}`,
      );
    }

    if (value !== null && value !== undefined && typeof value !== "string") {
      throw new Error(
        `Field "${field}" on slide ${slideNumber} must be a string`,
      );
    }

    if (hasStringValue(value)) {
      parsedFields[field as TemplateField] = value.trim();
    }
  }

  for (const field of template.requiredFields) {
    if (!hasStringValue(parsedFields[field])) {
      throw new Error(
        `AI omitted required field "${field}" on slide ${slideNumber}`,
      );
    }
  }

  return parsedFields;
}

function parseSlideVisualAssets(
  aiSlide: AIPlannedSlide,
  resolvedSlide: ResolvedSlideRecipe,
): SlideVisualAsset[] | undefined {
  const { slideNumber, recipe, activeImageZones } = resolvedSlide;

  /**
   * NONE slides must not request any visual work.
   */
  if (recipe.visualAssetMode === "NONE") {
    if (aiSlide.visualAssets !== undefined && aiSlide.visualAssets !== null) {
      throw new Error(
        `Slide ${slideNumber} returned visualAssets even though asset mode is NONE`,
      );
    }

    if (
      aiSlide.visualAssetBrief !== undefined &&
      aiSlide.visualAssetBrief !== null
    ) {
      throw new Error(
        `Slide ${slideNumber} returned legacy visualAssetBrief even though asset mode is NONE`,
      );
    }

    return undefined;
  }

  if (!Array.isArray(aiSlide.visualAssets)) {
    throw new Error(`Slide ${slideNumber} must return visualAssets`);
  }

  const expectedZoneIds = new Set(activeImageZones.map((zone) => zone.id));

  const seenZoneIds = new Set<string>();

  const visualAssets = aiSlide.visualAssets.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Slide ${slideNumber} contains an invalid visual asset`);
    }

    const asset = value as AIVisualAsset;

    if (
      typeof asset.imageZoneId !== "string" ||
      !expectedZoneIds.has(asset.imageZoneId)
    ) {
      throw new Error(
        `Slide ${slideNumber} returned invalid imageZoneId "${String(
          asset.imageZoneId,
        )}"`,
      );
    }

    if (seenZoneIds.has(asset.imageZoneId)) {
      throw new Error(
        `Slide ${slideNumber} returned duplicate image zone "${asset.imageZoneId}"`,
      );
    }

    if (!hasStringValue(asset.brief)) {
      throw new Error(
        `Slide ${slideNumber} returned an empty visual brief for "${asset.imageZoneId}"`,
      );
    }

    seenZoneIds.add(asset.imageZoneId);

    return {
      imageZoneId: asset.imageZoneId,
      brief: asset.brief.trim(),
    };
  });

  if (seenZoneIds.size !== expectedZoneIds.size) {
    throw new Error(
      `Slide ${slideNumber} did not provide one visual asset for every required image zone`,
    );
  }

  return visualAssets;
}

function validateAIResponse(
  value: unknown,
  expectedSlideCount: number,
): ValidatedAIStructuredPost {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Structured post response is not an object");
  }

  const post = value as AIStructuredPost;

  if (typeof post.caption !== "string" || !post.caption.trim()) {
    throw new Error("Structured post response is missing caption");
  }

  if (!Array.isArray(post.slides)) {
    throw new Error("Structured post response is missing slides");
  }

  if (post.slides.length !== expectedSlideCount) {
    throw new Error(
      `Expected ${expectedSlideCount} slides but AI returned ${post.slides.length}`,
    );
  }

  return {
    caption: post.caption,

    hashtags: post.hashtags,

    slides: post.slides,
  };
}

// ============================================================
// GENERATOR
// ============================================================

export async function generateStructuredPost(
  idea: ContentIdea,
  context: EngineContext,
  platform: Platform,
): Promise<StructuredGeneratedPost | null> {
  /**
   * Unsupported formats continue through
   * the existing legacy generation path.
   */
  if (idea.postKind !== "CAROUSEL" || !idea.archetype) {
    return null;
  }

  const recipe = getArchetypeRecipe(idea.archetype);

  if (!recipe) {
    return null;
  }

  const resolvedSlides = resolveRecipe(idea.archetype, recipe);

  const slideCount = resolvedSlides.length;

  const archetypeGuidance = getArchetypeGuidance(idea.archetype);

  const inspiration =
    context.signals.length > 0
      ? JSON.stringify(context.signals, null, 2)
      : "No additional inspiration was supplied.";

  const slideContracts = resolvedSlides.map(buildTemplateContract).join("\n");

  const prompt = `
You are Eddy's structured social-media writer.

The post structure has ALREADY been chosen.

Do not change:
- the archetype
- the number of slides
- narrative roles
- visual templates
- visual-asset requirements

Your job is only to write content that fits the supplied template contracts.

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

CURRENT INSPIRATION

${inspiration}

ARCHETYPE

${idea.archetype}

${archetypeGuidance}

SLIDE CONTRACTS

${slideContracts}

CONTENT RULES

- Follow the narrative role of each slide.
- Use ONLY fields allowed by that slide's visual template.
- Do not invent extra fields.
- Do not add slide numbers into the copy.
- Do not add logo, navigation, layout or typography instructions.
- Do not describe template backgrounds.
- Do not invent statistics, research, testimonials or product capabilities.
- Avoid generic EdTech marketing language.
- Do not repeat the same point across slides.
- Keep the writing concise enough for the supplied field limits.
- The renderer owns typography, spacing, branding and navigation.
- Do not use Markdown formatting inside slide fields.

VISUAL-ASSET RULE

If a slide says Generated visual asset = NONE:
- do not return visualAssets.

If a slide requires a generated visual:
- return "visualAssets".
- return exactly one visual asset for every image-zone ID listed in that slide contract.
- each visual asset must contain only:
  - imageZoneId
  - brief
- brief describes ONLY what the isolated visual should depict.
- keep the visual concept simple enough for a lightweight image model.
- prefer one clear subject or visual metaphor.
- avoid unnecessarily complex scenes.
- no headline text.
- no labels or written words.
- no logo.
- no navigation.
- no background design.
- no final-slide composition.
- do not specify coordinates, dimensions or typography.
- do not return visualAssetBrief.

Return ONLY strict valid JSON:

{
  "caption": "finished platform-appropriate caption",
  "hashtags": ["#Eddy"],
  "slides": [
    {
      "slideNumber": 1,
      "fields": {
        "eyebrow": "...",
        "headline": "...",
        "supportingLine": "..."
      }
    }
  ]
}

If a slide requires visual assets, include "visualAssets" inside that slide object using this shape:
{
  "slideNumber": 2,
  "fields": {
    "headline": "...",
    "body": "..."
  },
  "visualAssets": [
    {
      "imageZoneId": "the exact zone ID from that slide contract",
      "brief": "simple description of the isolated visual"
    }
  ]
}

The slides array must contain exactly ${slideCount} slides.

Slide numbers must be 1 through ${slideCount}.
`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const attemptPrompt =
      attempt === 1
        ? prompt
        : `${prompt}

IMPORTANT JSON CORRECTION

Your previous response was invalid.

Return the COMPLETE response again as strict valid JSON only.

- No markdown.
- No code fences.
- No text before or after JSON.
- Exactly ${slideCount} slides.
- Every slide must contain slideNumber and fields.
- Use only fields allowed by that slide's template.
- Close every object and array correctly.
`;

    const raw = await generateText(attemptPrompt, {
      json: true,

      temperature: attempt === 1 ? 0.6 : 0.2,
    });

    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn(`Invalid structured post JSON — attempt ${attempt}/3`);

      if (attempt === 3) {
        throw new Error(
          "AI returned invalid structured post JSON after 3 attempts",
        );
      }

      continue;
    }

    try {
      const aiPost = validateAIResponse(parsed, slideCount);

      const aiSlides = aiPost.slides as AIPlannedSlide[];

      const seenSlideNumbers = new Set<number>();

      const slides: SlideContent[] = resolvedSlides.map((resolvedSlide) => {
        const {
          slideNumber,
          recipe: slideRecipe,
          template,
          backgroundVariant,
        } = resolvedSlide;

        const matchingSlides = aiSlides.filter(
          (candidate) =>
            candidate &&
            typeof candidate === "object" &&
            candidate.slideNumber === slideNumber,
        );

        if (matchingSlides.length !== 1) {
          throw new Error(
            `Expected exactly one AI slide for slide ${slideNumber}`,
          );
        }

        const aiSlide = matchingSlides[0];

        seenSlideNumbers.add(slideNumber);

        const fields = parseSlideFields(aiSlide, resolvedSlide);

        const visualAssets = parseSlideVisualAssets(aiSlide, resolvedSlide);

        return {
          slideNumber,

          templateId: slideRecipe.templateId,

          templateVersion: template.version,

          ...(backgroundVariant
            ? {
                backgroundVariant,
              }
            : {}),

          narrativeRole: slideRecipe.narrativeRole,

          fields,

          visualAssetMode: slideRecipe.visualAssetMode,

          ...(visualAssets
            ? {
                visualAssets,
              }
            : {}),

          ...(slideRecipe.interactionState
            ? {
                interactionState: slideRecipe.interactionState,
              }
            : {}),
        };
      });

      if (seenSlideNumbers.size !== slideCount) {
        throw new Error("AI response contains invalid slide numbering");
      }

      const hashtags = Array.isArray(aiPost.hashtags)
        ? aiPost.hashtags.filter(
            (tag): tag is string =>
              typeof tag === "string" && tag.trim().length > 0,
          )
        : [];

      return {
        caption: aiPost.caption.trim(),

        hashtags,

        slides,
      };
    } catch (error) {
      console.warn(
        `Invalid structured post content — attempt ${attempt}/3`,
        error,
      );

      if (attempt === 3) {
        throw error;
      }
    }
  }

  throw new Error("AI failed to generate structured post");
}
