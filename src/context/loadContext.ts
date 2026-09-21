import fs from "fs/promises";
import path from "path";

import { getSignalsByIds } from "../storage/signalStore";
import type { EngineContext } from "./types";

export async function loadContext(
  signalIds: string[] = [],
): Promise<EngineContext> {
  const brandBrainPath = path.join(process.cwd(), "src/data/eddy-brain.md");

  const brandBrain = await fs.readFile(brandBrainPath, "utf-8");

  const signals = await getSignalsByIds(signalIds);

  return {
    brandBrain,
    signals,
  };
}
