import fs from "fs/promises";
import path from "path";

import type { ContentSignal, SignalType } from "../signals/types";

const storePath = path.join(process.cwd(), "src/data/content-signals.json");

async function readStore(): Promise<ContentSignal[]> {
  try {
    const raw = await fs.readFile(storePath, "utf-8");

    return JSON.parse(raw) as ContentSignal[];
  } catch {
    return [];
  }
}

async function writeStore(signals: ContentSignal[]): Promise<void> {
  await fs.writeFile(storePath, JSON.stringify(signals, null, 2), "utf-8");
}

export async function getSignals(): Promise<ContentSignal[]> {
  return readStore();
}

export async function addSignal(input: {
  type: SignalType;
  title?: string;
  content: string;
  sourceUrl?: string;
  sourceName?: string;
}): Promise<ContentSignal> {
  const signals = await readStore();

  const signal: ContentSignal = {
    id: crypto.randomUUID(),
    type: input.type,
    title: input.title,
    content: input.content,
    sourceUrl: input.sourceUrl,
    sourceName: input.sourceName,
    createdAt: new Date().toISOString(),
  };

  signals.push(signal);

  await writeStore(signals);

  return signal;
}

export async function getSignalsByIds(ids: string[]): Promise<ContentSignal[]> {
  if (ids.length === 0) {
    return [];
  }

  const signals = await readStore();

  return signals.filter((signal) => ids.includes(signal.id));
}
