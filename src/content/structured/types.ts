// ============================================================
// CONTENT ARCHETYPES
// ============================================================

export type ContentArchetype =
  | "INSIGHT_REFRAME"
  | "STRUCTURED_LIST"
  | "SEQUENCE"
  | "CONTRAST"
  | "PROBLEM_BETTER_WAY"
  | "FRAMEWORK_MODEL"
  | "EXPLAINER_QA"
  | "EVIDENCE_DATA_STORY"
  | "STORY_CASE"
  | "INTERACTIVE_SWIPE"
  | "MEME_RELATABLE"
  | "SOCIAL_TEXT_COMMENTARY";

export type NarrativeRole =
  | "HOOK"
  | "SETUP"
  | "PROBLEM"
  | "ASSUMPTION"
  | "REFRAME"
  | "EXPLANATION"
  | "EXAMPLE"
  | "EVIDENCE"
  | "COMPARISON"
  | "POINT"
  | "STEP"
  | "FRAMEWORK"
  | "STORY_BEAT"
  | "REVEAL"
  | "PAYOFF"
  | "APPLICATION"
  | "TAKEAWAY"
  | "CTA";

export type VisualAssetMode = "NONE" | "SUPPORTING" | "DOMINANT" | "PERSISTENT";

export type InteractionPattern =
  | "FOLLOW_PATH"
  | "PROGRESSIVE_REVEAL"
  | "PROGRESSIVE_ZOOM"
  | "CHOICE_REVEAL"
  | "PERSISTENT_OBJECT";

// ============================================================
// VISUAL TEMPLATES
// ============================================================

export type VisualTemplateId =
  | "TYPOGRAPHY_HERO"
  | "VISUAL_HERO"
  | "EXPLAINER"
  | "NUMBERED_POINT"
  | "SPLIT"
  | "TAKEAWAY"
  | "DATA_STAT"
  | "MEME_REACTION"
  | "MEME_DIALOGUE_SPLIT"
  | "INTERACTIVE_FOLLOW_PATH"
  | "INTERACTIVE_REVEAL"
  | "INTERACTIVE_ZOOM";

export type TemplateField =
  | "eyebrow"
  | "headline"
  | "subheadline"
  | "supportingLine"
  | "body"
  | "label"
  | "highlight"
  | "highlightPhrase"
  | "example"
  | "index"
  | "pointTitle"
  | "pointBody"
  | "pointExample"
  | "primaryLabel"
  | "secondaryLabel"
  | "sideALabel"
  | "sideAContent"
  | "sideBLabel"
  | "sideBContent"
  | "sharedTakeaway"
  | "primaryStat"
  | "comparisonStat"
  | "statContext"
  | "interpretation"
  | "sourceDisplay"
  | "takeaway"
  | "productLine"
  | "cta"
  | "instruction"
  | "stateLabel"
  | "hint"
  | "payoff"
  | "visualCaption";

export type TemplateReferenceState =
  | "SHORT_CONTENT"
  | "NORMAL_CONTENT"
  | "LONG_CONTENT";

export type HorizontalAlign = "LEFT" | "CENTER" | "RIGHT";

export type VerticalAlign = "TOP" | "CENTER" | "BOTTOM";

export type ImageFit = "CONTAIN" | "COVER" | "FILL";

export type ImageBackgroundPolicy = "TRANSPARENT" | "KEEP";

export type ImageGenerationSpec = {
  /**
   * Requested generation dimensions.
   *
   * These describe the isolated generated asset,
   * not the final social-media slide.
   */
  width: number;
  height: number;

  /**
   * TRANSPARENT means the preparation pipeline must
   * produce a transparent-background asset before rendering,
   * whether the provider supplies transparency directly or
   * background removal is required afterwards.
   */
  backgroundPolicy: ImageBackgroundPolicy;

  /**
   * Optional template-specific generation guidance.
   *
   * Example:
   * "single isolated object, visually weighted to the right"
   */
  promptGuidance?: string;
};

export type TextStyleToken =
  | "EYEBROW"
  | "HERO_HEADLINE"
  | "HEADLINE"
  | "SUBHEADLINE"
  | "BODY"
  | "LABEL"
  | "INDEX"
  | "STAT"
  | "TAKEAWAY"
  | "CTA"
  | "SOURCE";

export type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TemplateCanvas = {
  width: number;
  height: number;

  backgroundColor: string;

  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type BackgroundAsset = {
  path: string;

  type: "BLANK_STRUCTURAL_BACKGROUND";
};

export type PreviewImage = {
  path: string;

  state: TemplateReferenceState;
};

export type TextZone = LayoutRect & {
  id: string;

  field: TemplateField;

  styleToken: TextStyleToken;

  fontSize: number;

  fontWeight: 400 | 500 | 600 | 700;

  lineHeight: number;

  color: string;

  horizontalAlign?: HorizontalAlign;

  verticalAlign?: VerticalAlign;

  zIndex?: number;
};

export type ImageZone = LayoutRect & {
  id: string;

  fit: ImageFit;

  /**
   * Padding inside the placement rectangle.
   */
  padding?: number;

  allowedAssetModes: Exclude<VisualAssetMode, "NONE">[];

  /**
   * Exact requirements used by the visual-asset
   * preparation pipeline.
   */
  generation: ImageGenerationSpec;

  zIndex?: number;
};

export type LogoZone = LayoutRect & {
  horizontalAlign?: HorizontalAlign;

  verticalAlign?: VerticalAlign;

  zIndex?: number;
};

export type NavZone = LayoutRect & {
  supportsSlideNumber: boolean;

  supportsProgressIndicator: boolean;

  supportsInteractionInstruction: boolean;

  zIndex?: number;
};

export type CtaZone = LayoutRect & {
  styleToken: "CTA";

  horizontalAlign?: HorizontalAlign;

  zIndex?: number;
};

export type FieldLimit = {
  minWords?: number;

  maxWords?: number;

  maxCharacters?: number;

  maxLines?: number;
};

export type OverflowStrategy =
  | "WRAP"
  | "SMALLER_TYPOGRAPHY_TIER"
  | "REMOVE_OPTIONAL_COPY"
  | "REQUEST_SHORTER_COPY"
  | "REJECT";

export type TemplateOverflowRules = {
  strategyOrder: OverflowStrategy[];

  allowMarginViolation: false;

  allowTextOverlap: false;

  allowUnlimitedFontShrink: false;
};

export type TemplateBackgroundVariant = {
  id: string;

  backgroundAsset: BackgroundAsset;

  textZones?: TextZone[];

  imageZones?: ImageZone[];

  fieldLimits?: Partial<Record<TemplateField, FieldLimit>>;

  logoZone?: LogoZone;

  navZone?: NavZone;

  exclusionZones?: Array<
    LayoutRect & {
      id: string;
    }
  >;
};

export type VisualTemplateDefinition = {
  templateId: VisualTemplateId;

  version: number;

  supportedArchetypes: ContentArchetype[];

  supportedVariants: string[];

  canvas: TemplateCanvas;

  /**
   * Skin + layout belong to the same template contract.
   */
  backgroundAsset?: BackgroundAsset;

  backgroundVariants?: TemplateBackgroundVariant[];

  /**
   * Temporary compatibility with the existing Hero definition.
   *
   * We will not use this to automatically assign backgrounds
   * based on slide number.
   */
  backgroundVariantSequence?: string[];

  previewImages: PreviewImage[];

  textZones: TextZone[];

  imageZones: ImageZone[];

  logoZone: LogoZone;

  navZone?: NavZone;

  ctaZone?: CtaZone;

  requiredFields: TemplateField[];

  optionalFields: TemplateField[];

  fieldLimits: Partial<Record<TemplateField, FieldLimit>>;

  overflowRules: TemplateOverflowRules;

  supportedNarrativeRoles: NarrativeRole[];

  supportedAssetModes: VisualAssetMode[];

  supportsInteraction: boolean;

  supportsContinuity: boolean;
};

// ============================================================
// ARCHETYPE RECIPES
// ============================================================

export type ArchetypeSlideRecipe = {
  narrativeRole: NarrativeRole;

  templateId: VisualTemplateId;

  visualAssetMode: VisualAssetMode;

  interactionState?: string;
};

export type ArchetypeRecipe = {
  archetype: ContentArchetype;

  slides: ArchetypeSlideRecipe[];
};

// ============================================================
// GENERATED SLIDE CONTENT
// ============================================================

export type SlideItem = {
  label?: string;

  title?: string;

  body?: string;

  example?: string;
};

export type SlideVisualAsset = {
  /**
   * Must match an ImageZone.id on the resolved template.
   */
  imageZoneId: string;

  /**
   * Semantic description of only the isolated visual.
   *
   * No typography, logo, navigation or complete
   * social-media composition.
   */
  brief: string;

  /**
   * Populated by prepareVisualAssets()
   * after generation/background processing.
   */
  path?: string;
};

export type SlideContent = {
  slideNumber: number;

  templateId: VisualTemplateId;

  templateVersion: number;

  templateVariant?: string;

  /**
   * Explicit visual variant only.
   *
   * Slide number must never implicitly choose this.
   */
  backgroundVariant?: string;

  narrativeRole: NarrativeRole;

  /**
   * All renderer-owned text lives here.
   *
   * The active VisualTemplateDefinition determines
   * which fields are legal and where they are rendered.
   */
  fields: Partial<Record<TemplateField, string>>;

  /**
   * Only needed for templates containing repeated
   * structured content.
   */
  items?: SlideItem[];

  visualAssetMode: VisualAssetMode;

  /**
   * Visual assets requested by this slide.
   *
   * A template may expose one or multiple image zones.
   * Keeping this zone-based means future layouts such as
   * SPLIT do not require another pipeline architecture.
   */
  visualAssets?: SlideVisualAsset[];

  /**
   * Description of the isolated generated visual asset only.
   *
   * It must never describe final typography, branding,
   * navigation or full-slide composition.
   */
  visualAssetBrief?: string;

  visualAssetId?: string;

  sideAVisualAssetId?: string;

  sideBVisualAssetId?: string;

  interactionPattern?: InteractionPattern;

  interactionState?: string;

  continuityId?: string;

  continuityAssetId?: string;
};

// ============================================================
// GENERATED POST
// ============================================================

export type StructuredGeneratedPost = {
  caption: string;

  hashtags: string[];

  slides: SlideContent[];
};
