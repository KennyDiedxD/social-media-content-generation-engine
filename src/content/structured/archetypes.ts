import type { ArchetypeRecipe, ContentArchetype } from "./types";

export const ARCHETYPE_RECIPES: Partial<
  Record<ContentArchetype, ArchetypeRecipe>
> = {
  INSIGHT_REFRAME: {
    archetype: "INSIGHT_REFRAME",

    slides: [
      {
        narrativeRole: "HOOK",
        templateId: "TYPOGRAPHY_HERO",
        visualAssetMode: "NONE",
      },

      {
        narrativeRole: "REFRAME",
        templateId: "EXPLAINER",
        visualAssetMode: "SUPPORTING",
      },

      {
        narrativeRole: "TAKEAWAY",
        templateId: "TAKEAWAY",
        visualAssetMode: "NONE",
      },
    ],
  },
};

export function getArchetypeRecipe(
  archetype: ContentArchetype,
): ArchetypeRecipe | null {
  return ARCHETYPE_RECIPES[archetype] ?? null;
}
