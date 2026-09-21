import type { ContentArchetype } from "./structured/types";

export type Platform = "LinkedIn" | "Instagram";

export type ContentIdea = {
  title: string;
  pillar: string;
  angle: string;
  audience: string;
  whyItMatters: string;

  suggestedPlatforms: Platform[];

  postKind: PostKind;
  objective: ContentObjective;

  /**
   * New template-system route.
   *
   * Optional for backward compatibility:
   * older/generated ideas without an archetype continue
   * through the existing generatePost() flow.
   */
  archetype?: ContentArchetype;

  visualConcept?: string;

  signalIds?: string[];
};

export type GeneratedPost = {
  ideaTitle: string;
  platform: Platform;
  postKind: PostKind;

  text?: string;

  caption?: string;
  hashtags?: string[];

  visualBrief?: string;
  imagePrompt?: string;

  carouselSlides?: string[];
};

export type PostDraft = {
  id: string;
  ideaTitle: string;

  platform: Platform;
  postKind: PostKind;
  /**
   * True when this draft was created by the structured
   * template-rendering pipeline.
   *
   * Absent/false means legacy generation.
   */
  structured?: boolean;

  text?: string;
  caption?: string;
  hashtags?: string[];

  visualBrief?: string;
  imagePrompt?: string;

  carouselSlides?: string[];

  status: PostStatus;

  mediaStatus?: MediaStatus;
  mediaUrl?: string;
  mediaUrls?: string[];
  publishedAt?: string;
  platformPostId?: string;
};

export type PostStatus =
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED";

export type PostKind = "TEXT" | "IMAGE" | "CAROUSEL";

export type ContentObjective =
  | "THOUGHT_LEADERSHIP"
  | "PARENT_EDUCATION"
  | "PRODUCT_AWARENESS"
  | "ENGAGEMENT";

export type ContentRequest = {
  platforms: Platform[];
  postKind: PostKind;
  objective: ContentObjective;

  archetype?: ContentArchetype;

  signalIds?: string[];
};

export type MediaStatus = "NOT_REQUIRED" | "MISSING" | "ATTACHED";
