import fs from "node:fs/promises";
import path from "node:path";

import {
  createCanvas,
  loadImage,
  GlobalFonts,
  type SKRSContext2D,
} from "@napi-rs/canvas";

import {
  TYPOGRAPHY_HERO_V1,
  TYPOGRAPHY_HERO_V1_CALIBRATION,
} from "../content/rendering/templates/typographyHeroV1";

type HeadlineTierName = "XL" | "L" | "M" | "S";

type WrappedText = {
  lines: string[];
  width: number;
  height: number;
};

const ROOT = process.cwd();

const FONT_DIR = path.join(ROOT, "src", "assets", "fonts");

function registerFonts() {
  const fonts = [
    "Poppins-Regular.ttf",
    "Poppins-Medium.ttf",
    "Poppins-SemiBold.ttf",
    "Poppins-Bold.ttf",
  ];

  for (const file of fonts) {
    const fontPath = path.join(FONT_DIR, file);

    if (!GlobalFonts.registerFromPath(fontPath)) {
      throw new Error(`Could not register font: ${fontPath}`);
    }
  }
}

const OUTPUT_DIR = path.join(ROOT, "uploads", "template-previews");

const LOGO_PATH = path.join(ROOT, "src", "assets", "eddy-logo-icon.png");

const TEST_CASES = [
  {
    name: "short",
    eyebrow: "LEARNING",
    headline: "Marks aren't a diagnosis.",
    supportingLine:
      "A score can show the result without showing what the student needs next.",
  },
  {
    name: "normal",
    eyebrow: "LEARNING",
    headline: "Good marks can hide a learning problem.",
    supportingLine:
      "A score can show the result without showing what the student needs next.",
  },
  {
    name: "long",
    eyebrow: "LEARNING",
    headline: "More practice doesn't always mean better learning.",
    supportingLine:
      "A score can show the result without showing what the student needs next.",
  },
] as const;

function setFont(ctx: SKRSContext2D, fontSize: number, fontWeight: number) {
  ctx.font = `${fontWeight} ${fontSize}px Poppins`;
}

function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
): WrappedText {
  const words = text.trim().split(/\s+/).filter(Boolean);

  const lines: string[] = [];

  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    const candidateWidth = ctx.measureText(candidate).width;

    if (candidateWidth <= maxWidth || currentLine.length === 0) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  const width = Math.max(
    0,
    ...lines.map((line) => ctx.measureText(line).width),
  );

  return {
    lines,
    width,
    height: lines.length * lineHeight,
  };
}

function getStartingHeadlineTier(wordCount: number): HeadlineTierName {
  if (wordCount <= 5) {
    return "XL";
  }

  if (wordCount <= 8) {
    return "L";
  }

  if (wordCount <= 12) {
    return "M";
  }

  return "S";
}

/**
 * Word count determines only the starting heuristic.
 *
 * We allow the renderer to test one larger tier first,
 * so good wrapping is not unnecessarily penalised.
 *
 * Example:
 * 9 words starts at M, but L is tested first.
 */
function getHeadlineCandidateOrder(
  startingTier: HeadlineTierName,
): HeadlineTierName[] {
  switch (startingTier) {
    case "XL":
      return ["XL", "L", "M", "S"];

    case "L":
      return ["XL", "L", "M", "S"];

    case "M":
      return ["L", "M", "S"];

    case "S":
      return ["M", "S"];
  }
}

function chooseHeadlineLayout(
  ctx: SKRSContext2D,
  headline: string,
  zoneWidth: number,
  zoneHeight: number,
) {
  const calibration = TYPOGRAPHY_HERO_V1_CALIBRATION.headline;

  const wordCount = headline.trim().split(/\s+/).filter(Boolean).length;

  const startingTier = getStartingHeadlineTier(wordCount);

  const candidates = getHeadlineCandidateOrder(startingTier);

  /**
   * First pass:
   * prefer the approved 2–4 line range.
   */
  for (const tierName of candidates) {
    const tier = calibration.tiers[tierName];

    setFont(ctx, tier.fontSize, calibration.fontWeight);

    const wrapped = wrapText(ctx, headline, zoneWidth, tier.lineHeight);

    if (
      wrapped.lines.length <= calibration.preferredLines.max &&
      wrapped.height <= zoneHeight
    ) {
      return {
        tierName,
        tier,
        wrapped,
      };
    }
  }

  /**
   * Second pass:
   * allow the absolute 5-line maximum.
   */
  for (const tierName of candidates) {
    const tier = calibration.tiers[tierName];

    setFont(ctx, tier.fontSize, calibration.fontWeight);

    const wrapped = wrapText(ctx, headline, zoneWidth, tier.lineHeight);

    if (
      wrapped.lines.length <= calibration.absoluteMaxLines &&
      wrapped.height <= zoneHeight
    ) {
      return {
        tierName,
        tier,
        wrapped,
      };
    }
  }

  throw new Error(`Headline does not fit TYPOGRAPHY_HERO v1: "${headline}"`);
}

function drawLines(
  ctx: SKRSContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) {
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function drawTrackedText(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  trackingPx: number,
) {
  let currentX = x;

  for (const character of text) {
    ctx.fillText(character, currentX, y);

    currentX += ctx.measureText(character).width + trackingPx;
  }
}

function findTextZone(field: "eyebrow" | "headline" | "supportingLine") {
  const zone = TYPOGRAPHY_HERO_V1.textZones.find(
    (candidate) => candidate.field === field,
  );

  if (!zone) {
    throw new Error(`Missing ${field} zone in TYPOGRAPHY_HERO v1`);
  }

  return zone;
}

async function loadLocalImage(imagePath: string) {
  const buffer = await fs.readFile(imagePath);
  return loadImage(buffer);
}

async function drawContainedImage(
  ctx: SKRSContext2D,
  imagePath: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const image = await loadLocalImage(imagePath);

  const scale = Math.min(width / image.width, height / image.height);

  const renderedWidth = image.width * scale;

  const renderedHeight = image.height * scale;

  const renderedX = x + (width - renderedWidth) / 2;

  const renderedY = y + (height - renderedHeight) / 2;

  ctx.drawImage(image, renderedX, renderedY, renderedWidth, renderedHeight);
}

async function renderCase(testCase: (typeof TEST_CASES)[number]) {
  const { canvas: templateCanvas, logoZone, navZone } = TYPOGRAPHY_HERO_V1;

  const canvas = createCanvas(templateCanvas.width, templateCanvas.height);

  const ctx = canvas.getContext("2d");

  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // --------------------------------
  // Blank structural background
  // --------------------------------

  if (!TYPOGRAPHY_HERO_V1.backgroundAsset) {
    throw new Error("TYPOGRAPHY_HERO v1 has no production background asset.");
  }

  const backgroundPath = path.join(
    ROOT,
    TYPOGRAPHY_HERO_V1.backgroundAsset.path,
  );

  const background = await loadLocalImage(backgroundPath);

  ctx.drawImage(background, 0, 0, templateCanvas.width, templateCanvas.height);

  // --------------------------------
  // Eyebrow
  // --------------------------------

  const eyebrowZone = findTextZone("eyebrow");

  const eyebrowCalibration = TYPOGRAPHY_HERO_V1_CALIBRATION.eyebrow;

  setFont(ctx, eyebrowCalibration.fontSize, eyebrowCalibration.fontWeight);

  ctx.fillStyle = eyebrowCalibration.color;

  const eyebrow = testCase.eyebrow.toUpperCase();

  drawTrackedText(
    ctx,
    eyebrow,
    eyebrowZone.x,
    eyebrowZone.y,
    eyebrowCalibration.fontSize * eyebrowCalibration.letterSpacingEm,
  );

  // --------------------------------
  // Headline
  // --------------------------------

  const headlineZone = findTextZone("headline");

  const headlineLayout = chooseHeadlineLayout(
    ctx,
    testCase.headline,
    headlineZone.width,
    headlineZone.height,
  );

  setFont(
    ctx,
    headlineLayout.tier.fontSize,
    TYPOGRAPHY_HERO_V1_CALIBRATION.headline.fontWeight,
  );

  ctx.fillStyle = TYPOGRAPHY_HERO_V1_CALIBRATION.headline.color;

  drawLines(
    ctx,
    headlineLayout.wrapped.lines,
    headlineZone.x,
    headlineZone.y,
    headlineLayout.tier.lineHeight,
  );

  // --------------------------------
  // Supporting copy
  // --------------------------------

  const supportZone = findTextZone("supportingLine");

  const supportCalibration = TYPOGRAPHY_HERO_V1_CALIBRATION.supportingCopy;

  setFont(ctx, supportCalibration.fontSize, supportCalibration.fontWeight);

  ctx.fillStyle = supportCalibration.color;

  let supportWrapped = wrapText(
    ctx,
    testCase.supportingLine,
    supportZone.width,
    supportCalibration.lineHeight,
  );

  let supportFontSize = supportCalibration.fontSize;

  if (
    supportWrapped.lines.length > supportCalibration.maxLines ||
    supportWrapped.height > supportZone.height
  ) {
    let supportFontSize: number = supportCalibration.fontSize;
    setFont(ctx, supportFontSize, supportCalibration.fontWeight);

    supportWrapped = wrapText(
      ctx,
      testCase.supportingLine,
      supportZone.width,
      supportCalibration.lineHeight,
    );
  }

  if (
    supportWrapped.lines.length > supportCalibration.maxLines ||
    supportWrapped.height > supportZone.height
  ) {
    throw new Error(
      `Supporting copy does not fit: "${testCase.supportingLine}"`,
    );
  }

  const headlineBottom = headlineZone.y + headlineLayout.wrapped.height;

  const supportY = Math.min(supportZone.y, Math.max(700, headlineBottom + 64));

  drawLines(
    ctx,
    supportWrapped.lines,
    supportZone.x,
    supportY,
    supportCalibration.lineHeight,
  );

  // --------------------------------
  // Real Eddy logo
  // --------------------------------

  await drawContainedImage(
    ctx,
    LOGO_PATH,
    logoZone.x,
    logoZone.y,
    logoZone.width,
    logoZone.height,
  );

  // --------------------------------
  // Quiet carousel nav
  // --------------------------------

  if (navZone) {
    const navCalibration = TYPOGRAPHY_HERO_V1_CALIBRATION.carouselNav;

    setFont(ctx, navCalibration.fontSize, navCalibration.fontWeight);

    ctx.fillStyle = navCalibration.color;

    ctx.fillText("01 / 03", navZone.x, navZone.y);
  }

  // --------------------------------
  // Export
  // --------------------------------

  const outputPath = path.join(
    OUTPUT_DIR,
    `typography-hero-v1-${testCase.name}.png`,
  );

  const png = await canvas.encode("png");

  await fs.writeFile(outputPath, png);

  console.log(
    [
      `${testCase.name.toUpperCase()}:`,
      `${headlineLayout.tierName}`,
      `${headlineLayout.tier.fontSize}px`,
      `${headlineLayout.wrapped.lines.length} lines`,
      `→ ${outputPath}`,
    ].join(" "),
  );
}

async function main() {
  registerFonts();

  await fs.mkdir(OUTPUT_DIR, {
    recursive: true,
  });

  for (const testCase of TEST_CASES) {
    await renderCase(testCase);
  }

  console.log("\nTYPOGRAPHY_HERO v1 calibration renders complete.");
}

main().catch((error) => {
  console.error("Failed to render TYPOGRAPHY_HERO v1 calibration:", error);

  process.exit(1);
});
