export type InsightReframeContent = {
  archetype: "INSIGHT_REFRAME";

  hook: string;
  existingBelief: string;
  reframe: string;
  reason: string;
  takeaway: string;

  example?: string;
  parentImplication?: string;
  eddyConnection?: string;
};

export type StructuredListItem = {
  itemTitle: string;
  itemExplanation: string;

  itemExample?: string;
  itemLabel?: string;
};

export type StructuredListContent = {
  archetype: "STRUCTURED_LIST";

  listTitle: string;
  items: StructuredListItem[];
  closingTakeaway: string;
};

export type SequenceStage = {
  stageTitle: string;
  stageDescription: string;

  transitionReason?: string;
  stageExample?: string;
  timeMarker?: string;
  commonFailurePoint?: string;
};

export type SequenceContent = {
  archetype: "SEQUENCE";

  sequenceTitle: string;
  startingState: string;
  stages: SequenceStage[];
  endState: string;
};

export type ContrastPoint = {
  dimension: string;
  sideAPoint: string;
  sideBPoint: string;
};

export type ContrastContent = {
  archetype: "CONTRAST";

  contrastTitle: string;
  sideALabel: string;
  sideBLabel: string;
  comparisonPoints: ContrastPoint[];
  meaning: string;
};

export type ProblemBetterWayContent = {
  archetype: "PROBLEM_BETTER_WAY";

  problemHook: string;
  problem: string;
  underlyingCause: string;
  consequence: string;
  betterWay: string;
  takeaway: string;

  parentAction?: string;
  example?: string;
  eddyRole?: string;
};

export type FrameworkComponent = {
  componentName: string;
  componentDefinition: string;
};

export type FrameworkModelContent = {
  archetype: "FRAMEWORK_MODEL";

  frameworkName: string;
  frameworkPremise: string;
  components: FrameworkComponent[];
  application: string;

  axisX?: string;
  axisY?: string;
  levels?: string[];
  relationships?: string[];
  example?: string;
};

export type ExplainerQaContent = {
  archetype: "EXPLAINER_QA";

  question: string;
  shortAnswer: string;
  explanation: string;
  example: string;
  whyItMatters: string;

  analogy?: string;
  commonMisunderstanding?: string;
  parentAction?: string;
  followupQuestion?: string;
};

export type EvidenceSource = {
  title: string;

  publisher?: string;
  authors?: string[];
  publishedAt?: string;
  url?: string;

  sourceDisplay?: string;
};

export type EvidenceDataStoryContent = {
  archetype: "EVIDENCE_DATA_STORY";

  evidenceHook: string;
  finding: string;
  interpretation: string;
  implication: string;
  source: EvidenceSource;

  comparison?: string;
  methodNote?: string;
  caveat?: string;
  parentAction?: string;
};

export type StoryCaseType = "REAL" | "COMPOSITE" | "HYPOTHETICAL";

export type StoryCaseContent = {
  archetype: "STORY_CASE";

  characterContext: string;
  startingSituation: string;
  problem: string;
  turningPoint: string;
  change: string;
  outcome: string;
  lesson: string;

  quote?: string;
  timeline?: string;
  metric?: string;
  eddyRole?: string;
  caseType?: StoryCaseType;
};

export type InteractiveSwipeContent = {
  archetype: "INTERACTIVE_SWIPE";

  interactionInstruction: string;
  startingState: string;
  progressionStates: string[];
  reveal: string;
  learningPayoff: string;

  hint?: string;
  choiceOptions?: string[];
  secondaryReveal?: string;
  finalExplanation?: string;
};

export type MemeDialogueLine = {
  speaker?: string;
  text: string;
};

export type MemeRelatableContent = {
  archetype: "MEME_RELATABLE";

  setup: string;
  punchline: string;
  recognitionPoint: string;

  labels?: string[];
  dialogue?: MemeDialogueLine[];
  secondPanel?: string;
  captionContext?: string;
  eddyCallback?: string;
};

export type SocialTextCommentaryContent = {
  archetype: "SOCIAL_TEXT_COMMENTARY";

  primaryText: string;

  commentary?: string;
  highlightPhrase?: string;
  sourceContext?: string;
  takeaway?: string;
};

export type ArchetypeContent =
  | InsightReframeContent
  | StructuredListContent
  | SequenceContent
  | ContrastContent
  | ProblemBetterWayContent
  | FrameworkModelContent
  | ExplainerQaContent
  | EvidenceDataStoryContent
  | StoryCaseContent
  | InteractiveSwipeContent
  | MemeRelatableContent
  | SocialTextCommentaryContent;
