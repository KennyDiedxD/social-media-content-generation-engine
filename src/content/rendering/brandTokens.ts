export const EDDY_CANVAS = {
  width: 1080,
  height: 1350,
  aspectRatio: "4:5",

  background: "#FCFEFF",

  safeArea: {
    top: 90,
    right: 96,
    bottom: 84,
    left: 96,
  },
} as const;

export const EDDY_COLORS = {
  primary: "#154C79",
  secondaryBlue: "#1E81B0",

  primaryLight: "rgba(21, 76, 121, 0.10)",
  primaryMid: "rgba(21, 76, 121, 0.25)",

  background: "#FFFFFF",
  canvasBackground: "#FCFEFF",

  userFill: "#E28743",
  userBorder: "#EAB676",

  secondary: "rgba(34, 197, 148, 0.60)",

  accent: "rgba(255, 255, 255, 0.90)",

  cap: "#FCFAF7",

  bodyText: "#425466",

  white: "#FFFFFF",
} as const;

export const EDDY_TYPOGRAPHY = {
  fontFamily: "Poppins",

  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const EDDY_ASSETS = {
  logo: "src/assets/eddy-logo.png",
  logoIcon: "src/assets/eddy-logo-icon.png",
} as const;

export const EDDY_LOGO_RULES = {
  defaultPosition: "TOP_RIGHT",

  quietBranding: true,

  allowGeneratedLogo: false,

  allowFakeLogoText: false,

  allowOversizedBranding: false,
} as const;

export const EDDY_VISUAL_STYLE = {
  qualities: [
    "MODERN_EDITORIAL",
    "INTELLIGENT",
    "WARM",
    "CLEAN",
    "EDUCATIONAL",
    "PREMIUM",
    "MINIMAL",
  ],

  avoid: [
    "ROBOTS",
    "GLOWING_BRAINS",
    "LIGHTBULBS",
    "FLOATING_EQUATIONS",
    "FUTURISTIC_HUDS",
    "GENERIC_HOLOGRAMS",
    "CARTOON_SCHOOLCHILDREN",
    "OVERLY_CUTE_MASCOTS",
    "NEON_AI_GRADIENTS",
    "BUSY_3D_SCENES",
  ],

  dominantMetaphorsPerSlide: 1,
} as const;
