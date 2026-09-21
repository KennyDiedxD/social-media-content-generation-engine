import fs from "node:fs/promises";
import path from "node:path";

import { createCanvas } from "@napi-rs/canvas";

import { EDDY_CANVAS, EDDY_COLORS } from "../content/rendering/brandTokens";

const ROOT = process.cwd();

const OUTPUT_PATH = path.join(
  ROOT,
  "src",
  "assets",
  "templates",
  "explainer-v1.png",
);

async function main() {
  const canvas = createCanvas(EDDY_CANVAS.width, EDDY_CANVAS.height);

  const ctx = canvas.getContext("2d");

  // --------------------------------
  // Base canvas
  // --------------------------------

  ctx.fillStyle = EDDY_CANVAS.background;

  ctx.fillRect(0, 0, EDDY_CANVAS.width, EDDY_CANVAS.height);

  // --------------------------------
  // Right-side structural accent
  //
  // Keeps the body slide visually
  // different from TYPOGRAPHY_HERO
  // without occupying the text area.
  // --------------------------------

  ctx.fillStyle = EDDY_COLORS.primaryLight;

  ctx.beginPath();

  ctx.roundRect(858, 300, 150, 590, 75);

  ctx.fill();

  // Secondary smaller shape

  ctx.fillStyle = EDDY_COLORS.primaryMid;

  ctx.beginPath();

  ctx.roundRect(920, 700, 88, 250, 44);

  ctx.fill();

  // --------------------------------
  // Headline / explanation divider
  // --------------------------------

  ctx.fillStyle = "rgba(21, 76, 121, 0.16)";

  ctx.fillRect(96, 500, 640, 2);

  // Small accent marker

  ctx.fillStyle = "#EAB676";

  ctx.beginPath();

  ctx.roundRect(96, 496, 62, 10, 5);

  ctx.fill();

  // --------------------------------
  // Optional highlight region
  // --------------------------------

  ctx.fillStyle = "rgba(21, 76, 121, 0.06)";

  ctx.beginPath();

  ctx.roundRect(72, 940, 770, 185, 28);

  ctx.fill();

  // Highlight left accent

  ctx.fillStyle = "#EAB676";

  ctx.beginPath();

  ctx.roundRect(72, 940, 8, 185, 4);

  ctx.fill();

  // --------------------------------
  // Output
  // --------------------------------

  await fs.mkdir(path.dirname(OUTPUT_PATH), {
    recursive: true,
  });

  await fs.writeFile(OUTPUT_PATH, canvas.toBuffer("image/png"));

  console.log(`Created ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
