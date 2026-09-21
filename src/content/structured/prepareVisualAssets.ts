import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import {
  generateImageFromPrompt,
  type ImageProvider,
} from "../../services/imageProviderService";

import { getVisualTemplate } from "./templates";

import type { ImageZone, SlideContent, SlideVisualAsset } from "./types";

const ROOT = process.cwd();

// ============================================================
// TEMPLATE / ZONE RESOLUTION
// ============================================================

function resolveImageZones(slide: SlideContent): ImageZone[] {
  const template = getVisualTemplate(slide.templateId);

  let imageZones = template.imageZones;

  if (slide.backgroundVariant) {
    const variant = template.backgroundVariants?.find(
      (candidate) => candidate.id === slide.backgroundVariant,
    );

    if (!variant) {
      throw new Error(
        `Unknown background variant "${slide.backgroundVariant}" for ${template.templateId}`,
      );
    }

    imageZones = variant.imageZones ?? imageZones;
  }

  return imageZones;
}

// ============================================================
// PROMPT
// ============================================================

function buildVisualAssetPrompt(
  asset: SlideVisualAsset,
  zone: ImageZone,
): string {
  return `
Create one isolated editorial illustration.

SUBJECT:
${asset.brief}

REQUIREMENTS:
- one clear visual subject or subject group
- simple composition
- no text
- no labels
- no logo
- no interface
- no border or frame
- no social-media layout
- no decorative background
- solid pure white background
- strong visual separation between the subject and white background
- keep the complete subject comfortably away from the image edges
- avoid complex scenery
- avoid unnecessary objects

COMPOSITION GUIDANCE:
${zone.generation.promptGuidance ?? "Keep the subject compact and easy to isolate."}
`.trim();
}

// ============================================================
// LOCAL BACKGROUND REMOVAL
// ============================================================

function isNearWhite(r: number, g: number, b: number, threshold = 34): boolean {
  const dr = 255 - r;
  const dg = 255 - g;
  const db = 255 - b;

  const distance = Math.sqrt(dr * dr + dg * dg + db * db);

  return distance <= threshold;
}

/**
 * Removes only near-white pixels that are connected to
 * the outer image boundary.
 *
 * This is intentionally more conservative than removing
 * every white pixel, because the generated subject itself
 * may legitimately contain white areas.
 */
async function removeConnectedWhiteBackground(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const { width, height, channels } = info;

  if (channels !== 4) {
    throw new Error(
      `Expected RGBA image during background removal, received ${channels} channels`,
    );
  }

  const visited = new Uint8Array(width * height);

  const queue: number[] = [];

  function enqueue(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const pixelIndex = y * width + x;

    if (visited[pixelIndex]) {
      return;
    }

    const offset = pixelIndex * channels;

    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    if (!isNearWhite(r, g, b)) {
      return;
    }

    visited[pixelIndex] = 1;

    queue.push(pixelIndex);
  }

  // Seed flood fill from every image edge.
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }

  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  let cursor = 0;

  while (cursor < queue.length) {
    const pixelIndex = queue[cursor++];

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const offset = pixelIndex * channels;

    data[offset + 3] = 0;

    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  return sharp(data, {
    raw: {
      width,
      height,
      channels,
    },
  })
    .png()
    .toBuffer();
}

// ============================================================
// LOCAL NORMALISATION
// ============================================================

async function prepareAssetBuffer(
  rawBuffer: Buffer,
  zone: ImageZone,
): Promise<Buffer> {
  let working = rawBuffer;

  if (zone.generation.backgroundPolicy === "TRANSPARENT") {
    working = await removeConnectedWhiteBackground(working);
  }

  /**
   * Remove empty outer space locally rather than asking
   * the image model to perform exact placement.
   */
  const trimmed = await sharp(working)
    .trim({
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
    })
    .png()
    .toBuffer();

  /**
   * generation.width / height are preparation targets,
   * not requirements imposed on Gemini/Klein.
   */
  return sharp(trimmed)
    .resize({
      width: zone.generation.width,
      height: zone.generation.height,
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer();
}

// ============================================================
// SINGLE ASSET
// ============================================================

async function prepareSingleAsset(
  slide: SlideContent,
  asset: SlideVisualAsset,
  zone: ImageZone,
  outputDir: string,
  provider?: ImageProvider,
): Promise<SlideVisualAsset> {
  if (
    !zone.allowedAssetModes.includes(
      slide.visualAssetMode as Exclude<SlideContent["visualAssetMode"], "NONE">,
    )
  ) {
    throw new Error(
      `Image zone "${zone.id}" does not support asset mode ${slide.visualAssetMode}`,
    );
  }

  const prompt = buildVisualAssetPrompt(asset, zone);

  const generatedBuffer = await generateImageFromPrompt(prompt, provider);

  const preparedBuffer = await prepareAssetBuffer(generatedBuffer, zone);

  const safeZoneId = zone.id.replace(/[^a-zA-Z0-9_-]/g, "-");

  const filename = `${String(slide.slideNumber).padStart(2, "0")}-${safeZoneId}.png`;

  const outputPath = path.join(outputDir, filename);

  await fs.writeFile(outputPath, preparedBuffer);

  return {
    ...asset,

    /**
     * Store relative to the project root so the renderer
     * can resolve it consistently with template assets.
     */
    path: path.relative(ROOT, outputPath),
  };
}

// ============================================================
// POST VISUAL PREPARATION
// ============================================================

export async function prepareVisualAssets(
  slides: SlideContent[],
  postId: string,
  provider?: ImageProvider,
): Promise<SlideContent[]> {
  const outputDir = path.join(ROOT, "uploads", "generated-assets", postId);

  let outputDirCreated = false;

  const preparedSlides: SlideContent[] = [];

  for (const slide of slides) {
    if (slide.visualAssetMode === "NONE") {
      preparedSlides.push(slide);

      continue;
    }

    if (!slide.visualAssets?.length) {
      throw new Error(
        `Slide ${slide.slideNumber} requires visual assets but none were supplied`,
      );
    }

    const imageZones = resolveImageZones(slide);

    const zoneById = new Map(imageZones.map((zone) => [zone.id, zone]));

    if (!outputDirCreated) {
      await fs.mkdir(outputDir, {
        recursive: true,
      });

      outputDirCreated = true;
    }

    const preparedAssets: SlideVisualAsset[] = [];

    for (const asset of slide.visualAssets) {
      const zone = zoneById.get(asset.imageZoneId);

      if (!zone) {
        throw new Error(
          `Slide ${slide.slideNumber} references unknown image zone "${asset.imageZoneId}"`,
        );
      }

      preparedAssets.push(
        await prepareSingleAsset(slide, asset, zone, outputDir, provider),
      );
    }

    preparedSlides.push({
      ...slide,

      visualAssets: preparedAssets,
    });
  }

  return preparedSlides;
}
