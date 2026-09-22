export type Confidence = "high" | "medium" | "low";

export type Tone = "danger" | "caution" | "safe";

export type Insight = {
  id: string;
  label: string;
  detail: string;
  probability: number;
};

export type Signal = {
  id: string;
  label: string;
  detail: string;
  probability: number;
  active: boolean;
};

export type Pattern = {
  id: string;
  label: string;
  detail: string;
  probability: number;
  selected: boolean;
};

export type ScamCheckResponse = {
  verdict: "LIKELY_SCAM" | "LIKELY_LEGIT";
  tone: Tone;
  headline: string;
  isLikelyScam: boolean;
  scamProbability: number;
  riskScore: number;
  riskLabel: string;
  riskExplanation: string;
  scamType: string;
  scamTypeLabel: string;
  confidence: Confidence;
  confidenceDetail: string;
  summary: string;
  claimedSender: Insight;
  requestedAction: Insight;
  signals: Signal[];
  patterns: Pattern[];
  guidanceTitle: string;
  guidance: string[];
};

export function isScamCheckResponse(data: unknown): data is ScamCheckResponse {
  if (!data || typeof data !== "object") return false;
  const value = data as Partial<ScamCheckResponse>;
  return (
    (value.verdict === "LIKELY_SCAM" || value.verdict === "LIKELY_LEGIT") &&
    typeof value.summary === "string" &&
    typeof value.headline === "string" &&
    Array.isArray(value.signals) &&
    Array.isArray(value.guidance)
  );
}
