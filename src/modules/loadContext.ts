import fs from "fs/promises";
import path from "path";

export type ContentSignal = {
  source: string;
  signal: string;
};

export type EngineContext = {
  brandBrain: string;
  signals: ContentSignal[];
};

export async function loadContext(): Promise<EngineContext> {
  const brandBrainPath = path.join(process.cwd(), "src/data/eddy-brain.md");
  const signalsPath = path.join(process.cwd(), "src/data/sample-signals.json");

  const brandBrain = await fs.readFile(brandBrainPath, "utf-8");
  const signalsRaw = await fs.readFile(signalsPath, "utf-8");

  const signals = JSON.parse(signalsRaw) as ContentSignal[];

  return {
    brandBrain,
    signals,
  };
}