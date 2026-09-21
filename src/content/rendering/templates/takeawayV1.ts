import type {
  LogoZone,
  NavZone,
  VisualTemplateDefinition,
} from "../../structured/types";

import { EDDY_CANVAS, EDDY_COLORS } from "../brandTokens";

const TAKEAWAY_LOGO_ZONE: LogoZone = {
  x: 984,
  y: 42,
  width: 56,
  height: 56,

  horizontalAlign: "CENTER",
  verticalAlign: "CENTER",

  zIndex: 30,
};

const TAKEAWAY_NAV_ZONE: NavZone = {
  x: 456,
  y: 1235,
  width: 168,
  height: 38,

  supportsSlideNumber: true,
  supportsProgressIndicator: true,
  supportsInteractionInstruction: false,

  zIndex: 30,
};

export const TAKEAWAY_V1: VisualTemplateDefinition = {
  templateId: "TAKEAWAY",

  version: 1,

  supportedArchetypes: [
    "INSIGHT_REFRAME",
    "STRUCTURED_LIST",
    "SEQUENCE",
    "CONTRAST",
    "PROBLEM_BETTER_WAY",
    "FRAMEWORK_MODEL",
    "EXPLAINER_QA",
    "EVIDENCE_DATA_STORY",
    "STORY_CASE",
  ],

  supportedVariants: ["STANDARD", "WITH_SUPPORT"],

  canvas: {
    width: EDDY_CANVAS.width,
    height: EDDY_CANVAS.height,

    backgroundColor: EDDY_CANVAS.background,

    safeArea: {
      ...EDDY_CANVAS.safeArea,
    },
  },

  /**
   * Existing approved fixed background.
   * No new background asset is created.
   */
  backgroundAsset: {
    path: "src/assets/templates/typography-hero-followup-b-v1.png",
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
   * Takeaway deliberately has a different hierarchy
   * from both Hero and Explainer.
   *
   * Small label
   * ↓
   * dominant conclusion
   * ↓
   * optional short supporting line
   */
  textZones: [
    {
      id: "label",
      field: "label",

      x: 96,
      y: 285,
      width: 620,
      height: 42,

      styleToken: "LABEL",

      fontSize: 22,
      fontWeight: 600,
      lineHeight: 32,

      color: "#EAB676",

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },

    {
      id: "takeaway",
      field: "takeaway",

      x: 96,
      y: 370,
      width: 720,
      height: 390,

      styleToken: "TAKEAWAY",

      fontSize: 72,
      fontWeight: 700,
      lineHeight: 80,

      color: EDDY_COLORS.primary,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },

    {
      id: "supportingLine",
      field: "supportingLine",

      x: 96,
      y: 820,
      width: 660,
      height: 150,

      styleToken: "BODY",

      fontSize: 30,
      fontWeight: 400,
      lineHeight: 44,

      color: EDDY_COLORS.bodyText,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },
  ],

  imageZones: [],

  logoZone: TAKEAWAY_LOGO_ZONE,

  navZone: TAKEAWAY_NAV_ZONE,

  requiredFields: ["takeaway"],

  optionalFields: ["label", "supportingLine"],

  fieldLimits: {
    label: {
      maxWords: 4,
      maxCharacters: 32,
      maxLines: 1,
    },

    takeaway: {
      maxWords: 13,
      maxCharacters: 85,
      maxLines: 5,
    },

    supportingLine: {
      maxWords: 24,
      maxCharacters: 160,
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

  supportedNarrativeRoles: ["PAYOFF", "APPLICATION", "TAKEAWAY", "CTA"],

  supportedAssetModes: ["NONE"],

  supportsInteraction: false,

  supportsContinuity: false,
};
