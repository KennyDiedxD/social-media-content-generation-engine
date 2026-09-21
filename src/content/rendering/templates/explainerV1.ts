import type {
  VisualTemplateDefinition,
  TextZone,
  LogoZone,
  NavZone,
} from "../../structured/types";

import { EDDY_CANVAS, EDDY_COLORS } from "../brandTokens";
const ROOT = process.cwd();

const EXPLAINER_LOGO_ZONE: LogoZone = {
  x: 984,
  y: 42,
  width: 56,
  height: 56,

  horizontalAlign: "CENTER",
  verticalAlign: "CENTER",

  zIndex: 30,
};

const EXPLAINER_NAV_ZONE: NavZone = {
  x: 456,
  y: 1235,
  width: 168,
  height: 38,

  supportsSlideNumber: true,
  supportsProgressIndicator: false,
  supportsInteractionInstruction: false,

  zIndex: 30,
};

const EXPLAINER_TEXT_ZONES: TextZone[] = [
  {
    id: "eyebrow",
    field: "eyebrow",
    styleToken: "EYEBROW",

    x: 96,
    y: 190,
    width: 650,
    height: 40,

    fontSize: 22,
    fontWeight: 600,
    lineHeight: 32,

    color: "#EAB676",

    horizontalAlign: "LEFT",
    verticalAlign: "TOP",

    zIndex: 20,
  },

  {
    id: "headline",
    field: "headline",
    styleToken: "HEADLINE",

    x: 96,
    y: 255,
    width: 780,
    height: 230,

    fontSize: 64,
    fontWeight: 700,
    lineHeight: 72,

    color: EDDY_COLORS.primary,

    horizontalAlign: "LEFT",
    verticalAlign: "TOP",

    zIndex: 20,
  },

  {
    id: "body",
    field: "body",
    styleToken: "BODY",

    x: 96,
    y: 535,
    width: 720,
    height: 360,

    fontSize: 32,
    fontWeight: 400,
    lineHeight: 48,

    color: EDDY_COLORS.bodyText,

    horizontalAlign: "LEFT",
    verticalAlign: "TOP",

    zIndex: 20,
  },

  {
    id: "highlight",
    field: "highlight",
    styleToken: "TAKEAWAY",

    x: 96,
    y: 965,
    width: 720,
    height: 125,

    fontSize: 30,
    fontWeight: 600,
    lineHeight: 42,

    color: EDDY_COLORS.primary,

    horizontalAlign: "LEFT",
    verticalAlign: "TOP",

    zIndex: 20,
  },
];

export const EXPLAINER_V1: VisualTemplateDefinition = {
  templateId: "EXPLAINER",

  version: 1,

  supportedArchetypes: [
    "INSIGHT_REFRAME",
    "SEQUENCE",
    "PROBLEM_BETTER_WAY",
    "FRAMEWORK_MODEL",
    "EXPLAINER_QA",
    "EVIDENCE_DATA_STORY",
    "STORY_CASE",
  ],

  supportedVariants: ["STANDARD", "HIGHLIGHT"],

  canvas: {
    width: EDDY_CANVAS.width,
    height: EDDY_CANVAS.height,

    backgroundColor: EDDY_CANVAS.background,

    safeArea: {
      ...EDDY_CANVAS.safeArea,
    },
  },

  /**
   * Blank production background.
   *
   * Structural artwork only.
   * Text, logo and navigation remain renderer-owned.
   */
  backgroundAsset: {
    path: "src/assets/templates/typography-hero-followup-a-v1.png",
    type: "BLANK_STRUCTURAL_BACKGROUND",
  },

  backgroundVariants: [
    {
      id: "FOLLOWUP_A",
      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-a-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },
    },
    {
      id: "FOLLOWUP_B",
      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-b-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },
    },
    {
      id: "FOLLOWUP_C",
      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-c-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },
    },
    {
      id: "FOLLOWUP_D",
      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-d-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },
    },
  ],

  backgroundVariantSequence: [
    "FOLLOWUP_A",
    "FOLLOWUP_B",
    "FOLLOWUP_C",
    "FOLLOWUP_D",
  ],

  previewImages: [],

  /**
   * EXPLAINER has a materially different hierarchy
   * from TYPOGRAPHY_HERO:
   *
   * eyebrow
   * medium headline
   * substantial body copy
   * optional highlighted thought
   */
  textZones: [
    {
      id: "eyebrow",
      field: "eyebrow",

      x: 96,
      y: 190,
      width: 650,
      height: 40,

      styleToken: "EYEBROW",

      fontSize: 22,
      fontWeight: 600,
      lineHeight: 32,

      color: "#EAB676",

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },

    {
      id: "headline",
      field: "headline",

      x: 96,
      y: 255,
      width: 780,
      height: 230,

      styleToken: "HEADLINE",

      fontSize: 64,
      fontWeight: 700,
      lineHeight: 72,

      color: EDDY_COLORS.primary,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },

    {
      id: "body",
      field: "body",

      x: 96,
      y: 535,
      width: 720,
      height: 360,

      styleToken: "BODY",

      fontSize: 32,
      fontWeight: 400,
      lineHeight: 48,

      color: EDDY_COLORS.bodyText,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },

    {
      id: "highlight",
      field: "highlight",

      x: 96,
      y: 965,
      width: 720,
      height: 125,

      styleToken: "TAKEAWAY",

      fontSize: 30,
      fontWeight: 600,
      lineHeight: 42,

      color: EDDY_COLORS.primary,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },
  ],

  /**
   * Temporary supporting visual zone used to validate
   * the generated-asset pipeline end to end.
   *
   * Final placement will be calibrated later.
   */
  imageZones: [
    {
      id: "supportingVisual",

      // Keep this mostly outside the current text area.
      x: 830,
      y: 600,
      width: 180,
      height: 300,

      fit: "CONTAIN",

      padding: 8,

      allowedAssetModes: ["SUPPORTING"],

      generation: {
        // Preparation target only.
        // Gemini/Klein do not need to generate at this exact size.
        width: 512,
        height: 512,

        backgroundPolicy: "TRANSPARENT",

        promptGuidance:
          "Create one simple compact editorial illustration. Keep the complete subject centered, isolated, upright and clearly separated from the background.",
      },

      // Behind renderer-owned text.
      zIndex: 10,
    },
  ],

  logoZone: EXPLAINER_LOGO_ZONE,

  navZone: EXPLAINER_NAV_ZONE,

  requiredFields: ["headline", "body"],

  optionalFields: ["eyebrow", "highlight"],

  fieldLimits: {
    eyebrow: {
      maxWords: 4,
      maxCharacters: 32,
      maxLines: 1,
    },

    headline: {
      maxWords: 12,
      maxCharacters: 90,
      maxLines: 3,
    },

    body: {
      maxWords: 55,
      maxCharacters: 340,
      maxLines: 7,
    },

    highlight: {
      maxWords: 18,
      maxCharacters: 120,
      maxLines: 3,
    },
  },

  overflowRules: {
    strategyOrder: [
      "WRAP",
      "SMALLER_TYPOGRAPHY_TIER",
      "REMOVE_OPTIONAL_COPY",
      "REQUEST_SHORTER_COPY",
      "REJECT",
    ],

    allowMarginViolation: false,
    allowTextOverlap: false,
    allowUnlimitedFontShrink: false,
  },

  supportedNarrativeRoles: [
    "SETUP",
    "PROBLEM",
    "REFRAME",
    "EXPLANATION",
    "EXAMPLE",
    "EVIDENCE",
    "POINT",
    "APPLICATION",
  ],

  supportedAssetModes: ["NONE", "SUPPORTING"],

  supportsInteraction: false,

  supportsContinuity: false,
};
