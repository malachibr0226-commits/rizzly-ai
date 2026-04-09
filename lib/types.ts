import type { GoalKey } from "@/lib/analytics";

export type Reply = {
  text: string;
  scores: {
    confidence: number;
    engagement: number;
    responseChance: number;
  };
  rating?: number;
  isFavorite?: boolean;
  image?: string;
};

export type Analysis = {
  summary?: string;
  vibe?: string;
  strength?: string;
  risk?: string;
  toneUsed?: string;
  strategy?: string;
  depthMode?: string;
  userPattern?: string;
  receiverPattern?: string;
  languageStyle?: string;
  adaptationNote?: string;
  timingWindow?: string;
  avoid?: string;
  coachNotes?: string;
  dynamicReading?: string;
  nonReactiveResponse?: string;
  whenNotToReply?: string;
  behaviorFlags?: string[];
  nextMoves?: string[];
  replyBranches?: Array<{
    scenario: string;
    move: string;
    note: string;
  }>;
};

export type ScreenshotParseResult = {
  transcriptLines: string[];
  suggestedProfileName: string;
  relationshipNotes: string;
  summary: string;
  suggestedGoal: GoalKey;
  personaHint: string;
};

export type DictationTarget = "conversation" | "context";
