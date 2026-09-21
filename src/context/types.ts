import type { ContentSignal } from "../signals/types";

export type EngineContext = {
  brandBrain: string;
  signals: ContentSignal[];
};
