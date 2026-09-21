import { EDDY_CANVAS, EDDY_COLORS } from "../brandTokens";

import type {
  LogoZone,
  NavZone,
  TextZone,
  VisualTemplateDefinition,
} from "../../structured/types";

/**
 * Typography calibration for TYPOGRAPHY_HERO v1.
 *
 * These values are NOT yet final approved typography tokens.
 * They are the starting values for visual testing against the
 * approved blank production background.
 */
export const TYPOGRAPHY_HERO_V1_CALIBRATION = {
  version: "calibration_v0",

  eyebrow: {
    fontFamily: "Poppins",
    fontSize: 22,
    lineHeight: 32,
    fontWeight: 600,
    letterSpacingEm: 0.22,
    uppercaseOptional: true,
    color: "#EAB676",
  },

  headline: {
    fontFamily: "Poppins",
    fontWeight: 700,
    letterSpacingEm: 0,

    tiers: {
      XL: {
        fontSize: 104,
        lineHeight: 104,
        startingWordRange: [1, 5],
      },

      L: {
        fontSize: 96,
        lineHeight: 98,
        startingWordRange: [6, 8],
      },

      M: {
        fontSize: 84,
        lineHeight: 88,
        startingWordRange: [9, 12],
      },

      S: {
        fontSize: 74,
        lineHeight: 80,
        startingWordRange: [13, 15],
      },
    },

    preferLargestFittingTier: true,

    preferredLines: {
      min: 2,
      max: 4,
    },

    absoluteMaxLines: 5,

    color: "#154C79",
  },

  supportingCopy: {
    fontFamily: "Poppins",
    fontSize: 32,
    fallbackFontSize: 30,
    lineHeight: 42,
    fontWeight: 400,
    maxLines: 3,
    color: "rgba(21, 76, 121, 0.68)",
  },

  carouselNav: {
    fontFamily: "Poppins",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 500,
    color: "rgba(21, 76, 121, 0.58)",
  },

  cta: {
    fontFamily: "Poppins",
    fontSize: 26,
    lineHeight: 34,
    fontWeight: 600,

    enabledByDefault: false,
  },

  followup: {
    eyebrow: {
      fontFamily: "Poppins",
      fontSize: 26,
      lineHeight: 34,
      fontWeight: 600,
      letterSpacingEm: 0.18,

      // Preserve the accent treatment we already selected.
      color: "#EAB676",
    },

    headline: {
      fontFamily: "Poppins",
      fontWeight: 700,
      letterSpacingEm: 0,

      tiers: {
        XL: {
          fontSize: 92,
          lineHeight: 96,
          startingWordRange: [1, 5],
        },

        L: {
          fontSize: 84,
          lineHeight: 90,
          startingWordRange: [6, 8],
        },

        M: {
          fontSize: 76,
          lineHeight: 84,
          startingWordRange: [9, 12],
        },

        S: {
          fontSize: 68,
          lineHeight: 76,
          startingWordRange: [13, 15],
        },
      },

      preferredLines: {
        min: 2,
        max: 4,
      },

      absoluteMaxLines: 5,

      color: EDDY_COLORS.primary,
    },

    supportingCopy: {
      fontFamily: "Poppins",
      fontSize: 32,
      lineHeight: 44,
      fontWeight: 400,
      maxLines: 3,

      color: "rgba(21, 76, 121, 0.68)",
    },

    carouselNav: {
      fontFamily: "Poppins",
      fontSize: 22,
      lineHeight: 28,
      fontWeight: 500,

      color: "rgba(21, 76, 121, 0.58)",
    },
  },
} as const;

const TYPOGRAPHY_HERO_LOGO_ZONE: LogoZone = {
  // Same position as the approved opening Hero.
  x: 984,
  y: 42,
  width: 56,
  height: 56,

  horizontalAlign: "CENTER",
  verticalAlign: "CENTER",

  zIndex: 30,
};

const TYPOGRAPHY_HERO_FOLLOWUP_NAV_ZONE: NavZone = {
  x: 456,
  y: 1235,
  width: 168,
  height: 38,

  supportsSlideNumber: true,
  supportsProgressIndicator: false,
  supportsInteractionInstruction: false,

  zIndex: 30,
};

const TYPOGRAPHY_HERO_FOLLOWUP_TEXT_ZONES: TextZone[] = [
  {
    id: "eyebrow",
    field: "eyebrow",

    x: 96,
    y: 330,
    width: 620,
    height: 44,

    styleToken: "EYEBROW",

    fontSize: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.eyebrow.fontSize,

    fontWeight: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.eyebrow.fontWeight,

    lineHeight: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.eyebrow.lineHeight,

    color: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.eyebrow.color,

    horizontalAlign: "LEFT",
    verticalAlign: "TOP",

    zIndex: 20,
  },

  {
    id: "headline",
    field: "headline",

    x: 96,
    y: 395,
    width: 760,
    height: 330,

    styleToken: "HERO_HEADLINE",

    // L is the initial follow-up tier.
    fontSize: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.headline.tiers.L.fontSize,

    fontWeight: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.headline.fontWeight,

    lineHeight:
      TYPOGRAPHY_HERO_V1_CALIBRATION.followup.headline.tiers.L.lineHeight,

    color: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.headline.color,

    horizontalAlign: "LEFT",
    verticalAlign: "TOP",

    zIndex: 20,
  },

  {
    id: "supportingCopy",
    field: "supportingLine",

    x: 96,
    y: 765,
    width: 650,
    height: 140,

    styleToken: "BODY",

    fontSize: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.supportingCopy.fontSize,

    fontWeight:
      TYPOGRAPHY_HERO_V1_CALIBRATION.followup.supportingCopy.fontWeight,

    lineHeight:
      TYPOGRAPHY_HERO_V1_CALIBRATION.followup.supportingCopy.lineHeight,

    color: TYPOGRAPHY_HERO_V1_CALIBRATION.followup.supportingCopy.color,

    horizontalAlign: "LEFT",
    verticalAlign: "TOP",

    zIndex: 20,
  },
];

export const TYPOGRAPHY_HERO_V1: VisualTemplateDefinition = {
  templateId: "TYPOGRAPHY_HERO",
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
    "SOCIAL_TEXT_COMMENTARY",
  ],

  supportedVariants: [
    "STATEMENT",
    "STATEMENT_SUPPORT",
    "QUESTION",
    "EMPHASIS",
    "SOCIAL_TEXT",
  ],

  canvas: {
    width: EDDY_CANVAS.width,
    height: EDDY_CANVAS.height,

    backgroundColor: EDDY_CANVAS.background,

    safeArea: {
      ...EDDY_CANVAS.safeArea,
    },
  },

  /**
   * Approved blank production background.
   *
   * This file contains structural artwork only.
   * Text, logo, navigation and CTA are renderer-owned.
   */
  backgroundAsset: {
    path: "src/assets/templates/typography-hero-v1.png",
    type: "BLANK_STRUCTURAL_BACKGROUND",
  },

  backgroundVariants: [
    {
      id: "FOLLOWUP_A",

      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-a-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },

      textZones: TYPOGRAPHY_HERO_FOLLOWUP_TEXT_ZONES,

      logoZone: TYPOGRAPHY_HERO_LOGO_ZONE,

      navZone: TYPOGRAPHY_HERO_FOLLOWUP_NAV_ZONE,

      exclusionZones: [
        {
          id: "topLeft",
          x: 0,
          y: 0,
          width: 220,
          height: 310,
        },
        {
          id: "topRight",
          x: 840,
          y: 0,
          width: 240,
          height: 520,
        },
        {
          id: "bottomLeft",
          x: 0,
          y: 1010,
          width: 215,
          height: 340,
        },
        {
          id: "bottomRight",
          x: 840,
          y: 1000,
          width: 240,
          height: 350,
        },
      ],
    },

    {
      id: "FOLLOWUP_B",

      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-b-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },

      textZones: TYPOGRAPHY_HERO_FOLLOWUP_TEXT_ZONES,

      logoZone: TYPOGRAPHY_HERO_LOGO_ZONE,

      navZone: TYPOGRAPHY_HERO_FOLLOWUP_NAV_ZONE,

      exclusionZones: [
        {
          id: "topLeft",
          x: 0,
          y: 0,
          width: 225,
          height: 335,
        },
        {
          id: "rightLower",
          x: 690,
          y: 520,
          width: 390,
          height: 830,
        },
        {
          id: "lowerCenter",
          x: 500,
          y: 1170,
          width: 400,
          height: 180,
        },
      ],
    },

    {
      id: "FOLLOWUP_C",

      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-c-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },

      textZones: TYPOGRAPHY_HERO_FOLLOWUP_TEXT_ZONES,

      logoZone: TYPOGRAPHY_HERO_LOGO_ZONE,

      navZone: TYPOGRAPHY_HERO_FOLLOWUP_NAV_ZONE,

      exclusionZones: [
        {
          id: "topLeft",
          x: 0,
          y: 0,
          width: 235,
          height: 340,
        },
        {
          id: "lowerRight",
          x: 720,
          y: 850,
          width: 360,
          height: 500,
        },
      ],
    },

    {
      id: "FOLLOWUP_D",

      backgroundAsset: {
        path: "src/assets/templates/typography-hero-followup-d-v1.png",
        type: "BLANK_STRUCTURAL_BACKGROUND",
      },

      textZones: TYPOGRAPHY_HERO_FOLLOWUP_TEXT_ZONES,

      logoZone: TYPOGRAPHY_HERO_LOGO_ZONE,

      navZone: TYPOGRAPHY_HERO_FOLLOWUP_NAV_ZONE,

      exclusionZones: [
        {
          id: "topLeft",
          x: 0,
          y: 0,
          width: 215,
          height: 325,
        },
        {
          id: "rightLower",
          x: 780,
          y: 700,
          width: 300,
          height: 550,
        },
        {
          id: "bottomLeft",
          x: 0,
          y: 1160,
          width: 330,
          height: 190,
        },
      ],
    },
  ],

  backgroundVariantSequence: [
    "FOLLOWUP_A",
    "FOLLOWUP_B",
    "FOLLOWUP_C",
    "FOLLOWUP_D",
  ],

  /**
   * Filled specimens/previews can be added later.
   * They are never used as production backgrounds.
   */
  previewImages: [],

  textZones: [
    {
      id: "eyebrow",
      field: "eyebrow",

      // Eyebrow
      x: 96,
      y: 294,
      width: 650,
      height: 40,

      styleToken: "EYEBROW",

      fontSize: TYPOGRAPHY_HERO_V1_CALIBRATION.eyebrow.fontSize,

      fontWeight: TYPOGRAPHY_HERO_V1_CALIBRATION.eyebrow.fontWeight,

      lineHeight: TYPOGRAPHY_HERO_V1_CALIBRATION.eyebrow.lineHeight,

      color: TYPOGRAPHY_HERO_V1_CALIBRATION.eyebrow.color,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },

    {
      id: "headline",
      field: "headline",

      // Headline
      x: 96,
      y: 365,
      width: 760,
      height: 410,

      styleToken: "HERO_HEADLINE",

      /**
       * L is the initial/default calibration tier.
       *
       * The renderer will later choose XL/L/M/S based on
       * measured wrapping and actual zone fit.
       */
      fontSize: TYPOGRAPHY_HERO_V1_CALIBRATION.headline.tiers.L.fontSize,

      fontWeight: TYPOGRAPHY_HERO_V1_CALIBRATION.headline.fontWeight,

      lineHeight: TYPOGRAPHY_HERO_V1_CALIBRATION.headline.tiers.L.lineHeight,

      color: TYPOGRAPHY_HERO_V1_CALIBRATION.headline.color,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },

    {
      id: "supportingCopy",
      field: "supportingLine",

      // Supporting
      x: 96,
      y: 790,
      width: 680,
      height: 130,

      styleToken: "BODY",

      fontSize: TYPOGRAPHY_HERO_V1_CALIBRATION.supportingCopy.fontSize,

      fontWeight: TYPOGRAPHY_HERO_V1_CALIBRATION.supportingCopy.fontWeight,

      lineHeight: TYPOGRAPHY_HERO_V1_CALIBRATION.supportingCopy.lineHeight,

      color: TYPOGRAPHY_HERO_V1_CALIBRATION.supportingCopy.color,

      horizontalAlign: "LEFT",
      verticalAlign: "TOP",

      zIndex: 20,
    },
  ],

  /**
   * TYPOGRAPHY_HERO never requests generated artwork.
   */
  imageZones: [],

  logoZone: TYPOGRAPHY_HERO_LOGO_ZONE,

  navZone: {
    x: 96,
    y: 1236,
    width: 180,
    height: 40,

    supportsSlideNumber: true,
    supportsProgressIndicator: true,
    supportsInteractionInstruction: false,

    zIndex: 30,
  },

  /**
   * CTA is intentionally off for normal Typography Hero use.
   * No CTA zone is reserved.
   */
  requiredFields: ["headline"],

  optionalFields: ["eyebrow", "supportingLine"],

  fieldLimits: {
    eyebrow: {
      maxLines: 1,
    },

    headline: {
      maxWords: 15,
      maxCharacters: 90,
      maxLines: 5,
    },

    supportingLine: {
      maxWords: 28,
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
    "HOOK",
    "SETUP",
    "ASSUMPTION",
    "REFRAME",
    "EXPLANATION",
    "EVIDENCE",
    "PAYOFF",
    "TAKEAWAY",
  ],

  supportedAssetModes: ["NONE"],

  supportsInteraction: false,
  supportsContinuity: false,
};
