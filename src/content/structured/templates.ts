import type { VisualTemplateDefinition, VisualTemplateId } from "./types";

import { TYPOGRAPHY_HERO_V1 } from "../rendering/templates/typographyHeroV1";

import { EXPLAINER_V1 } from "../rendering/templates/explainerV1";

import { TAKEAWAY_V1 } from "../rendering/templates/takeawayV1";

/**
 * Single source of truth for available visual templates.
 *
 * No runtime registration is required.
 */
export const VISUAL_TEMPLATES: Partial<
  Record<VisualTemplateId, VisualTemplateDefinition>
> = {
  TYPOGRAPHY_HERO: TYPOGRAPHY_HERO_V1,

  EXPLAINER: EXPLAINER_V1,

  TAKEAWAY: TAKEAWAY_V1,
};

export function getVisualTemplate(
  templateId: VisualTemplateId,
): VisualTemplateDefinition {
  const template = VISUAL_TEMPLATES[templateId];

  if (!template) {
    throw new Error(`Visual template is not implemented: ${templateId}`);
  }

  return template;
}
