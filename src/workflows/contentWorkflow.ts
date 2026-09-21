import path from "node:path";

import { loadContext } from "../context/loadContext";

import { generateIdeas } from "../content/generateIdeas";
import { generatePost } from "../content/generatePost";

import { generateStructuredPost } from "../content/structured/generateStructuredPost";

import { renderStructuredPost } from "../content/structured/renderStructuredPost";

import type { SlideContent, TemplateField } from "../content/structured/types";

import type { ContentIdea, ContentRequest, PostDraft } from "../content/types";

import { prepareVisualAssets } from "../content/structured/prepareVisualAssets";

import type { ImageProvider } from "../services/imageProviderService";

import {
  getPostDrafts,
  savePostDrafts,
  updatePostMediaUrls,
} from "../storage/postStore";

export async function createContentIdeas(request: ContentRequest) {
  const context = await loadContext(request.signalIds ?? []);

  return generateIdeas(context, request);
}

// ============================================================
// LEGACY DASHBOARD COMPATIBILITY
// ============================================================

const LEGACY_FIELD_ORDER: TemplateField[] = [
  "eyebrow",
  "label",

  "headline",
  "subheadline",

  "body",

  "supportingLine",

  "highlight",
  "highlightPhrase",

  "pointTitle",
  "pointBody",
  "pointExample",

  "primaryLabel",
  "sideALabel",
  "sideAContent",

  "secondaryLabel",
  "sideBLabel",
  "sideBContent",

  "primaryStat",
  "comparisonStat",
  "statContext",
  "interpretation",
  "sourceDisplay",

  "takeaway",

  "productLine",

  "cta",
];

function slideToLegacyText(slide: SlideContent): string {
  return LEGACY_FIELD_ORDER.map((field) => slide.fields[field])
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join("\n\n");
}

// ============================================================
// MEDIA PATH
// ============================================================

function mediaPathToUrl(mediaPath: string): string {
  const uploadsRoot = path.join(process.cwd(), "uploads");

  const relativePath = path.relative(uploadsRoot, mediaPath);

  return "/uploads/" + relativePath.split(path.sep).join("/");
}

// ============================================================
// DRAFT CREATION
// ============================================================

type PendingDraft = {
  draft: PostDraft;

  structuredSlides?: SlideContent[];
};

export async function createPostDrafts(
  idea: ContentIdea,
  imageProvider?: ImageProvider,
): Promise<PostDraft[]> {
  const existingDrafts = await getPostDrafts();

  /**
   * Older drafts do not contain postKind,
   * so continue treating them as TEXT.
   */
  const existingForRequest = existingDrafts.filter(
    (draft) =>
      draft.ideaTitle === idea.title &&
      (draft.postKind ?? "TEXT") === idea.postKind &&
      idea.suggestedPlatforms.includes(draft.platform),
  );

  const missingPlatforms = idea.suggestedPlatforms.filter(
    (platform) =>
      !existingForRequest.some((draft) => draft.platform === platform),
  );

  if (missingPlatforms.length === 0) {
    return existingForRequest;
  }

  const context = await loadContext(idea.signalIds ?? []);

  console.log("Draft idea signalIds:", idea.signalIds);

  console.log(
    "Draft context signals:",
    context.signals.map((signal) => ({
      id: signal.id,

      title: signal.title,

      content: signal.content.slice(0, 200),
    })),
  );

  // ----------------------------------------------------------
  // Generate drafts
  // ----------------------------------------------------------

  const pendingDrafts = await Promise.all(
    missingPlatforms.map(async (platform): Promise<PendingDraft> => {
      /**
       * The structured generator decides
       * whether this idea is supported.
       *
       * Unsupported formats/archetypes
       * return null and fall through to
       * the legacy generator.
       */
      const structured = await generateStructuredPost(idea, context, platform);

      if (structured) {
        const id = crypto.randomUUID();

        const draft: PostDraft = {
          id,

          ideaTitle: idea.title,

          platform,

          postKind: idea.postKind,

          structured: true,

          caption: structured.caption,

          hashtags: structured.hashtags,

          /**
           * Temporary compatibility with
           * the existing dashboard.
           *
           * SlideContent[] remains the
           * authoritative representation.
           */
          carouselSlides: structured.slides.map(slideToLegacyText),

          status: "READY_FOR_REVIEW",

          mediaStatus: "MISSING",
        };

        return {
          draft,

          structuredSlides: structured.slides,
        };
      }

      // --------------------------------------------------
      // Legacy fallback
      // --------------------------------------------------

      const post = await generatePost(idea, context, platform);

      const draft: PostDraft = {
        id: crypto.randomUUID(),

        ...post,

        status: "READY_FOR_REVIEW",

        mediaStatus: post.postKind === "TEXT" ? "NOT_REQUIRED" : "MISSING",
      };

      return {
        draft,
      };
    }),
  );

  /**
   * Persist drafts before rendering because
   * updatePostMediaUrls() updates by draft ID.
   */
  await savePostDrafts(pendingDrafts.map(({ draft }) => draft));

  // ----------------------------------------------------------
  // Render structured posts immediately
  // ----------------------------------------------------------

  const completedDrafts = await Promise.all(
    pendingDrafts.map(async ({ draft, structuredSlides }) => {
      if (!structuredSlides) {
        return draft;
      }

      const preparedSlides = await prepareVisualAssets(
        structuredSlides,
        draft.id,
        imageProvider,
      );

      const rendered = await renderStructuredPost(preparedSlides, draft.id);
      const mediaUrls = rendered.mediaPaths.map(mediaPathToUrl);

      const updatedDraft = await updatePostMediaUrls(draft.id, mediaUrls);

      if (!updatedDraft) {
        throw new Error(`Could not attach rendered media to draft ${draft.id}`);
      }

      return updatedDraft;
    }),
  );

  return [...existingForRequest, ...completedDrafts];
}
