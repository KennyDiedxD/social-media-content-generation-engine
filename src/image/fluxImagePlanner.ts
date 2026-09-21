import { generateText } from "../llm/llmClient";
import type { FluxImagePlan } from "./fluxTypes";

type FluxPlannerInput = {
  ideaTitle: string;
  caption?: string;
  visualBrief: string;
};

function isRatio(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 1;
}

function trimForPrompt(value: string | undefined, maxLength: number): string {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function isValidPlan(value: unknown): value is FluxImagePlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan = value as Record<string, unknown>;

  if (!plan.textZone || typeof plan.textZone !== "object") {
    return false;
  }

  const zone = plan.textZone as Record<string, unknown>;

  if (
    typeof plan.overlayText !== "string" ||
    !plan.overlayText.trim() ||
    typeof plan.visualPrompt !== "string" ||
    !plan.visualPrompt.trim() ||
    !isRatio(zone.xRatio) ||
    !isRatio(zone.yRatio) ||
    !isRatio(zone.widthRatio) ||
    !isRatio(zone.heightRatio)
  ) {
    return false;
  }

  if (zone.xRatio + zone.widthRatio > 1 || zone.yRatio + zone.heightRatio > 1) {
    return false;
  }

  return (
    ["left", "center", "right"].includes(String(zone.alignment)) &&
    ["NONE", "GRADIENT", "TRANSLUCENT_PANEL"].includes(
      String(plan.textBackdrop),
    ) &&
    ["HEADLINE", "EDITORIAL", "QUOTE"].includes(String(plan.textStyle))
  );
}

export async function createFluxImagePlan(
  input: FluxPlannerInput,
): Promise<FluxImagePlan> {
  /*
   * Keep injected context small because this planner
   * runs on the local Gemma model.
   */
  const ideaTitle = trimForPrompt(input.ideaTitle, 300);

  const visualBrief = trimForPrompt(input.visualBrief, 1200);

  const caption = trimForPrompt(input.caption, 1400);

  const prompt = `
You are Eddy's visual art director.

Plan ONE premium social-media illustration for FLUX.

FLUX generates artwork only.
Eddy adds the real headline and branding afterwards.

SOURCE

Idea:
${ideaTitle}

Visual brief:
${visualBrief}

Caption:
${caption || "None"}

IMPORTANT

The supplied visual brief is inspiration, not a literal storyboard.

You may simplify or reinterpret it.

If it suggests:
- multiple scenes
- comparisons
- several people
- before/after layouts

compress the underlying idea into ONE stronger visual metaphor.

Do not preserve a weak composition just because it appears in the visual brief.

YOUR OUTPUT MUST DECIDE

1. Short overlay headline.
2. One strong visual metaphor.
3. One text-safe region.
4. Whether that text needs a backdrop.

HOUSE STYLE

Default visual style:

premium stylized editorial illustration,
clean 2D/2.5D forms,
soft dimensional shading,
restrained cream, blue and muted accent palette,
modern educational campaign aesthetic,
non-photorealistic.

The image should feel DESIGNED,
not like a literal scene description.

Prefer:
- one strong focal point
- one primary subject OR symbolic object
- one memorable metaphor
- clean geometry
- controlled detail
- generous negative space
- strong visual hierarchy
- elegant composition

Avoid:
- photorealism
- stock-photo aesthetics
- anime
- children's-book cartoon style
- split-screen compositions
- collage layouts
- infographics
- excessive props
- piles of books unless central to the metaphor
- multiple people explaining things to each other
- busy classrooms
- overly dramatic facial expressions
- generic AI imagery

CONCEPT RULE

Reduce the message to ONE visual idea.

Do not try to illustrate every sentence.

Prefer metaphor over literal explanation.

Examples of useful thinking:
- many guiding hands overwhelming one student
- many arrows pointing in conflicting directions
- shortcuts blocking a clear path
- answers piled up while foundations remain weak
- a maze versus one clear learning path
- unstable blocks versus a strong foundation

These are examples only.
Invent the strongest metaphor for the supplied content.

TEXT PLACEMENT

Choose textZone BEFORE writing visualPrompt.

Then design the composition around that zone.

The text zone should contain only:
- negative space
- simple background
- subtle texture
- low-detail material

Never place inside the text zone:
- people
- faces
- hands
- books
- furniture
- focal objects
- diagrams
- important details

Main subjects must remain clearly outside it.

Prefer asymmetric compositions:
- subject right, text space left
- subject left, text space right
- subject low, text space above
- focal object offset from center with space opposite

Do not always choose the same location.

Keep the top-right reasonably clear when practical
because Eddy's real logo may be added there.

OVERLAY TEXT

overlayText should normally be 4-12 words.

It must:
- express the core idea
- use only supported claims
- contain no hashtags
- normally avoid the word "Eddy"

VISUAL PROMPT

visualPrompt is sent directly to FLUX.

Keep it concise and visually specific.

It should include:
1. the single visual metaphor
2. the primary subject
3. composition
4. house style
5. reserved negative-space location
6. exclusions

Prefer prompts shaped like:

"Premium stylized editorial illustration of [visual metaphor].
[Primary subject/action].
Clean asymmetric composition with the focal subject positioned [location].
Reserve [location] as simple negative space for headline placement.
Clean 2D/2.5D digital illustration, refined shapes, restrained cream and blue palette,
soft dimensional shading, sophisticated education-brand aesthetic.
Minimal props, clean background, strong visual hierarchy.
No split screen, no collage, no photorealism.
Do not render any text, letters, words, numbers, captions, labels,
logos, brand names, watermarks or interface elements."

Do not write a long narrative scene.

TEXT ZONE

All values are ratios from 0 to 1.

Ensure:
xRatio + widthRatio <= 1
yRatio + heightRatio <= 1

Keep enough space for a headline,
without wasting excessive image area.

BACKDROP

Use:
"NONE" when naturally clean.
"GRADIENT" when subtle contrast helps.
"TRANSLUCENT_PANEL" only when necessary.

TEXT STYLE

Use:
"HEADLINE" for most posts.
"EDITORIAL" for slightly longer copy.
"QUOTE" only for genuine quote-like content.

Return ONLY valid JSON:

{
  "overlayText": "...",
  "visualPrompt": "...",
  "textZone": {
    "xRatio": 0.05,
    "yRatio": 0.08,
    "widthRatio": 0.40,
    "heightRatio": 0.25,
    "alignment": "left"
  },
  "textBackdrop": "NONE",
  "textStyle": "HEADLINE"
}
`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const attemptPrompt =
      attempt === 1
        ? prompt
        : `${prompt}

Previous output was invalid.

Return the COMPLETE plan again as strict valid JSON only.
No markdown, commentary or code fences.
`;

    const result = await generateText(attemptPrompt, {
      json: true,
      temperature: attempt === 1 ? 0.4 : 0.2,
    });

    try {
      const parsed = JSON.parse(result) as unknown;

      if (isValidPlan(parsed)) {
        return parsed;
      }

      console.warn(`Invalid FLUX image plan — attempt ${attempt}/3`, parsed);
    } catch {
      console.warn(`Invalid FLUX planner JSON — attempt ${attempt}/3`, result);
    }
  }

  throw new Error("Failed to create a valid FLUX image plan");
}
