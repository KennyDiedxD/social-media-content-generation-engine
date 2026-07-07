import fs from "fs/promises";
import path from "path";

export type PlatformBrain = "linkedin" | "instagram-carousel";

export type CoreContext = {
  brandBrain: string;
  creativeBrain: string;
  signals: unknown;
};

export type PlatformContext = CoreContext & {
  platformBrain: string;
};

async function readTextFile(...parts: string[]): Promise<string> {
  return fs.readFile(path.join(process.cwd(), ...parts), "utf-8");
}

export async function loadCoreContext(): Promise<CoreContext> {
  const [brandBrain, creativeBrain, signalsRaw] = await Promise.all([
    readTextFile("src", "data", "eddy-brain.md"),
    readTextFile("src", "data", "eddy-creative-brain.md"),
    readTextFile("src", "data", "sample-signals.json"),
  ]);

  return {
    brandBrain,
    creativeBrain,
    signals: JSON.parse(signalsRaw),
  };
}

export async function loadPlatformContext(
  platform: PlatformBrain
): Promise<PlatformContext> {
  const [coreContext, platformBrain] = await Promise.all([
    loadCoreContext(),
    readTextFile("src", "data", "platform-brains", `${platform}.md`),
  ]);

  return {
    ...coreContext,
    platformBrain,
  };
}