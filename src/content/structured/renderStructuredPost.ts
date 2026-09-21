import fs from "node:fs/promises";
import path from "node:path";

import {
  createCanvas,
  loadImage,
  GlobalFonts,
  type SKRSContext2D,
} from "@napi-rs/canvas";

import { getVisualTemplate } from "./templates";

import type {
  FieldLimit,
  SlideContent,
  TemplateField,
  TextZone,
  VisualTemplateDefinition,
} from "./types";

export type RenderedCarouselSlide = {
  slideNumber: number;
  filename: string;
  path: string;
};

export type RenderStructuredPostResult = {
  slides: RenderedCarouselSlide[];
  mediaPaths: string[];
};

type WrappedText = {
  lines: string[];
  width: number;
  height: number;
};

type ResolvedTemplateLayout = {
  backgroundPath: string;

  textZones: TextZone[];

  imageZones: VisualTemplateDefinition["imageZones"];

  logoZone: VisualTemplateDefinition["logoZone"];

  navZone: VisualTemplateDefinition["navZone"];

  fieldLimits: VisualTemplateDefinition["fieldLimits"];
};

const ROOT = process.cwd();

const FONT_DIR = path.join(ROOT, "src", "assets", "fonts");

const LOGO_PATH = path.join(ROOT, "src", "assets", "eddy-logo-icon.png");

let fontsRegistered = false;

// ============================================================
// FONT / IMAGE HELPERS
// ============================================================

function registerFonts(): void {
  if (fontsRegistered) {
    return;
  }

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

  fontsRegistered = true;
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
): Promise<void> {
  const image = await loadLocalImage(imagePath);

  const scale = Math.min(width / image.width, height / image.height);

  const renderedWidth = image.width * scale;

  const renderedHeight = image.height * scale;

  ctx.drawImage(
    image,
    x + (width - renderedWidth) / 2,
    y + (height - renderedHeight) / 2,
    renderedWidth,
    renderedHeight,
  );
}

function setFont(
  ctx: SKRSContext2D,
  fontSize: number,
  fontWeight: number,
): void {
  ctx.font = `${fontWeight} ${fontSize}px Poppins`;
}

// ============================================================
// TEXT LAYOUT
// ============================================================

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

    const width = ctx.measureText(candidate).width;

    if (width <= maxWidth || currentLine.length === 0) {
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

function getScaleCandidates(zone: TextZone): number[] {
  switch (zone.styleToken) {
    case "HERO_HEADLINE":
      return [1.08, 1, 0.92, 0.84, 0.76];

    case "HEADLINE":
    case "TAKEAWAY":
    case "STAT":
      return [1, 0.94, 0.88, 0.82];

    default:
      return [1, 0.95, 0.9, 0.85];
  }
}

function fitTextToZone(
  ctx: SKRSContext2D,
  text: string,
  zone: TextZone,
  limit?: FieldLimit,
) {
  const candidates = getScaleCandidates(zone);

  for (const scale of candidates) {
    const fontSize = Math.round(zone.fontSize * scale);

    const lineHeight = Math.round(zone.lineHeight * scale);

    setFont(ctx, fontSize, zone.fontWeight);

    const wrapped = wrapText(ctx, text, zone.width, lineHeight);

    const zoneLineLimit = Math.max(1, Math.floor(zone.height / lineHeight));

    const allowedLines =
      limit?.maxLines !== undefined
        ? Math.min(limit.maxLines, zoneLineLimit)
        : zoneLineLimit;

    if (wrapped.lines.length <= allowedLines && wrapped.height <= zone.height) {
      return {
        fontSize,
        lineHeight,
        wrapped,
      };
    }
  }

  throw new Error(`Text does not fit field "${zone.field}": "${text}"`);
}

function getTextX(zone: TextZone): number {
  switch (zone.horizontalAlign ?? "LEFT") {
    case "CENTER":
      return zone.x + zone.width / 2;

    case "RIGHT":
      return zone.x + zone.width;

    case "LEFT":
    default:
      return zone.x;
  }
}

function setTextAlignment(ctx: SKRSContext2D, zone: TextZone): void {
  switch (zone.horizontalAlign ?? "LEFT") {
    case "CENTER":
      ctx.textAlign = "center";
      break;

    case "RIGHT":
      ctx.textAlign = "right";
      break;

    case "LEFT":
    default:
      ctx.textAlign = "left";
      break;
  }
}

function getTextY(zone: TextZone, contentHeight: number): number {
  switch (zone.verticalAlign ?? "TOP") {
    case "CENTER":
      return zone.y + (zone.height - contentHeight) / 2;

    case "BOTTOM":
      return zone.y + zone.height - contentHeight;

    case "TOP":
    default:
      return zone.y;
  }
}

function drawWrappedText(
  ctx: SKRSContext2D,
  lines: string[],
  zone: TextZone,
  y: number,
  lineHeight: number,
): void {
  setTextAlignment(ctx, zone);

  const x = getTextX(zone);

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });

  ctx.textAlign = "left";
}

function measureTrackedText(
  ctx: SKRSContext2D,
  text: string,
  trackingPx: number,
): number {
  let width = 0;

  for (let index = 0; index < text.length; index++) {
    width += ctx.measureText(text[index]).width;

    if (index < text.length - 1) {
      width += trackingPx;
    }
  }

  return width;
}

function drawTrackedText(
  ctx: SKRSContext2D,
  text: string,
  zone: TextZone,
  trackingPx: number,
): void {
  const width = measureTrackedText(ctx, text, trackingPx);

  let x = zone.x;

  if (zone.horizontalAlign === "CENTER") {
    x = zone.x + (zone.width - width) / 2;
  }

  if (zone.horizontalAlign === "RIGHT") {
    x = zone.x + zone.width - width;
  }

  for (const character of text) {
    ctx.fillText(character, x, zone.y);

    x += ctx.measureText(character).width + trackingPx;
  }
}

// ============================================================
// TEMPLATE RESOLUTION
// ============================================================

function resolveTemplateLayout(
  slide: SlideContent,
  template: VisualTemplateDefinition,
): ResolvedTemplateLayout {
  let backgroundAsset = template.backgroundAsset;

  let textZones = template.textZones;

  let imageZones = template.imageZones;

  let logoZone = template.logoZone;

  let navZone = template.navZone;

  let fieldLimits = template.fieldLimits;

  /**
   * Variants are explicit only.
   *
   * Slide number never chooses
   * a background automatically.
   */
  if (slide.backgroundVariant) {
    const variant = template.backgroundVariants?.find(
      (candidate) => candidate.id === slide.backgroundVariant,
    );

    if (!variant) {
      throw new Error(
        `Unknown background variant "${slide.backgroundVariant}" for ${template.templateId}`,
      );
    }

    backgroundAsset = variant.backgroundAsset;

    textZones = variant.textZones ?? textZones;

    imageZones = variant.imageZones ?? imageZones;

    logoZone = variant.logoZone ?? logoZone;

    navZone = variant.navZone ?? navZone;

    fieldLimits = {
      ...fieldLimits,
      ...variant.fieldLimits,
    };
  }

  if (!backgroundAsset) {
    throw new Error(
      `${template.templateId} has no production background asset`,
    );
  }

  return {
    backgroundPath: backgroundAsset.path,

    textZones,

    imageZones,

    logoZone,

    navZone,

    fieldLimits,
  };
}

// ============================================================
// VALIDATION
// ============================================================

function validateSlideAgainstTemplate(
  slide: SlideContent,
  template: VisualTemplateDefinition,
): void {
  if (slide.templateVersion !== template.version) {
    throw new Error(
      `Slide ${slide.slideNumber} requests ${template.templateId} v${slide.templateVersion}, but v${template.version} is registered`,
    );
  }

  if (
    slide.templateVariant &&
    !template.supportedVariants.includes(slide.templateVariant)
  ) {
    throw new Error(
      `Unsupported variant "${slide.templateVariant}" for ${template.templateId}`,
    );
  }

  if (!template.supportedNarrativeRoles.includes(slide.narrativeRole)) {
    throw new Error(
      `${template.templateId} does not support narrative role ${slide.narrativeRole}`,
    );
  }

  if (!template.supportedAssetModes.includes(slide.visualAssetMode)) {
    throw new Error(
      `${template.templateId} does not support visual asset mode ${slide.visualAssetMode}`,
    );
  }

  for (const field of template.requiredFields) {
    const value = slide.fields[field];

    if (typeof value !== "string" || !value.trim()) {
      throw new Error(
        `Slide ${slide.slideNumber} is missing required field "${field}"`,
      );
    }
  }

  const legalFields = new Set<TemplateField>([
    ...template.requiredFields,
    ...template.optionalFields,
  ]);

  for (const field of Object.keys(slide.fields)) {
    if (!legalFields.has(field as TemplateField)) {
      throw new Error(
        `Slide ${slide.slideNumber} contains illegal field "${field}" for ${template.templateId}`,
      );
    }
  }
}

// ============================================================
// TEXT RENDERING
// ============================================================

function renderTextZone(
  ctx: SKRSContext2D,
  slide: SlideContent,
  zone: TextZone,
  limit?: FieldLimit,
): void {
  const rawValue = slide.fields[zone.field];

  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return;
  }

  let value = rawValue.trim();

  if (zone.styleToken === "EYEBROW") {
    value = value.toUpperCase();

    setFont(ctx, zone.fontSize, zone.fontWeight);

    ctx.fillStyle = zone.color;

    const tracking = zone.fontSize * 0.08;

    const width = measureTrackedText(ctx, value, tracking);

    if (width > zone.width) {
      throw new Error(`Eyebrow does not fit field "${zone.field}": "${value}"`);
    }

    drawTrackedText(ctx, value, zone, tracking);

    return;
  }

  const layout = fitTextToZone(ctx, value, zone, limit);

  setFont(ctx, layout.fontSize, zone.fontWeight);

  ctx.fillStyle = zone.color;

  const y = getTextY(zone, layout.wrapped.height);

  drawWrappedText(ctx, layout.wrapped.lines, zone, y, layout.lineHeight);
}

// ============================================================
// SINGLE SLIDE
// ============================================================

async function renderSlide(
  slide: SlideContent,
  totalSlides: number,
  outputDir: string,
): Promise<RenderedCarouselSlide> {
  const template = getVisualTemplate(slide.templateId);

  validateSlideAgainstTemplate(slide, template);

  const resolved = resolveTemplateLayout(slide, template);

  const canvas = createCanvas(template.canvas.width, template.canvas.height);

  const ctx = canvas.getContext("2d");

  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // --------------------------------
  // Background
  // --------------------------------

  const background = await loadLocalImage(
    path.join(ROOT, resolved.backgroundPath),
  );

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // --------------------------------
  // Generated visual assets
  // --------------------------------

  for (const asset of slide.visualAssets ?? []) {
    const zone = resolved.imageZones.find(
      (candidate) => candidate.id === asset.imageZoneId,
    );

    if (!zone || !asset.path) {
      continue;
    }

    const padding = zone.padding ?? 0;

    await drawContainedImage(
      ctx,
      path.join(ROOT, asset.path),
      zone.x + padding,
      zone.y + padding,
      zone.width - padding * 2,
      zone.height - padding * 2,
    );
  }

  // --------------------------------
  // Text
  // --------------------------------

  const orderedTextZones = [...resolved.textZones].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0),
  );

  for (const zone of orderedTextZones) {
    renderTextZone(ctx, slide, zone, resolved.fieldLimits[zone.field]);
  }

  // --------------------------------
  // Logo
  // --------------------------------

  await drawContainedImage(
    ctx,
    LOGO_PATH,
    resolved.logoZone.x,
    resolved.logoZone.y,
    resolved.logoZone.width,
    resolved.logoZone.height,
  );

  // --------------------------------
  // Navigation
  // --------------------------------

  if (
    totalSlides > 1 &&
    resolved.navZone &&
    resolved.navZone.supportsSlideNumber
  ) {
    setFont(ctx, 18, 500);

    ctx.fillStyle = "rgba(21, 76, 121, 0.58)";

    ctx.textAlign = "center";

    const current = String(slide.slideNumber).padStart(2, "0");

    const total = String(totalSlides).padStart(2, "0");

    ctx.fillText(
      `${current} / ${total}`,
      resolved.navZone.x + resolved.navZone.width / 2,
      resolved.navZone.y,
    );

    ctx.textAlign = "left";
  }

  // --------------------------------
  // Save
  // --------------------------------

  const filename = `${String(slide.slideNumber).padStart(2, "0")}.png`;

  const outputPath = path.join(outputDir, filename);

  const png = await canvas.encode("png");

  await fs.writeFile(outputPath, png);

  return {
    slideNumber: slide.slideNumber,

    filename,

    path: outputPath,
  };
}

// ============================================================
// POST RENDERER
// ============================================================

export async function renderStructuredPost(
  slides: SlideContent[],
  postId: string,
): Promise<RenderStructuredPostResult> {
  registerFonts();

  if (slides.length === 0) {
    throw new Error("Cannot render a structured post with no slides");
  }

  const orderedSlides = [...slides].sort(
    (a, b) => a.slideNumber - b.slideNumber,
  );

  const outputDir = path.join(ROOT, "uploads", "generated-posts", postId);

  await fs.mkdir(outputDir, {
    recursive: true,
  });

  const renderedSlides: RenderedCarouselSlide[] = [];

  for (const slide of orderedSlides) {
    renderedSlides.push(
      await renderSlide(slide, orderedSlides.length, outputDir),
    );
  }

  return {
    slides: renderedSlides,

    mediaPaths: renderedSlides.map((slide) => slide.path),
  };
}
