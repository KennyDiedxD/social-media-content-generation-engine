export type SignalType =
  | "NOTE"
  | "ARTICLE"
  | "SOCIAL_POST"
  | "NEWS"
  | "PRODUCT_UPDATE";

export type ContentSignal = {
  id: string;
  type: SignalType;

  title?: string;
  content: string;

  sourceUrl?: string;
  sourceName?: string;

  createdAt: string;
};
