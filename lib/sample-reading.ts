import type { ScamCheckResponse } from "@/lib/scam-types";

export const sampleMessage =
  "DBS Bank: Unusual sign-in on your account. It will be locked in 30 minutes unless you verify now: https://dbs-secure-login.co/verify";

export const sampleReading: ScamCheckResponse = {
  verdict: "LIKELY_SCAM",
  tone: "danger",
  headline: "Treat this as a scam.",
  isLikelyScam: true,
  scamProbability: 0.94,
  riskScore: 3.6,
  riskLabel: "Strong scam signs",
  riskExplanation: "Several classic scam tactics show up together.",
  scamType: "phishing",
  scamTypeLabel: "Phishing",
  confidence: "high",
  confidenceDetail: "The signals agree with each other.",
  summary:
    "This looks like a phishing attempt. It presents itself as a bank or payment app, and it is trying to get you to open a link. The loudest signs are time pressure, a link to follow, and borrowed identity.",
  claimedSender: {
    id: "bank",
    label: "A bank",
    detail: "It speaks as a bank, card issuer, or payment app.",
    probability: 0.91,
  },
  requestedAction: {
    id: "click_link",
    label: "Open a link",
    detail: "It wants you to tap a link, button, or web page.",
    probability: 0.96,
  },
  signals: [
    {
      id: "link",
      label: "A link to follow",
      detail: "A URL, shortened link, or button that leaves the conversation.",
      probability: 0.98,
      active: true,
    },
    {
      id: "urgency",
      label: "Time pressure",
      detail: "Deadlines, countdowns, or language that says to act now.",
      probability: 0.93,
      active: true,
    },
    {
      id: "impersonation",
      label: "A borrowed identity",
      detail: "It wears the name of a company, agency, or someone you know.",
      probability: 0.9,
      active: true,
    },
    {
      id: "threat",
      label: "Threats",
      detail: "Warnings of a lockout, fine, arrest, or other harm if you wait.",
      probability: 0.72,
      active: true,
    },
    {
      id: "secrets",
      label: "A request for a secret",
      detail: "Passwords, one-time codes, or account recovery details.",
      probability: 0.41,
      active: false,
    },
    {
      id: "payment",
      label: "A request for money",
      detail: "A fee, transfer, gift card, or crypto payment.",
      probability: 0.08,
      active: false,
    },
    {
      id: "too_good",
      label: "An unexpected offer",
      detail: "A prize, refund, job, or windfall you were not waiting on.",
      probability: 0.04,
      active: false,
    },
  ],
  patterns: [
    {
      id: "phishing",
      label: "Phishing",
      detail:
        "A fake login, verification step, or page built to collect credentials.",
      probability: 0.81,
      selected: true,
    },
    {
      id: "impersonation",
      label: "Impersonation",
      detail: "Someone pretending to be an institution or a person you trust.",
      probability: 0.11,
      selected: false,
    },
    {
      id: "urgency",
      label: "Pressure",
      detail: "The main tactic is rushing you before you can think.",
      probability: 0.05,
      selected: false,
    },
    {
      id: "financial",
      label: "Payment",
      detail: "A push to pay, transfer, or buy gift cards or crypto.",
      probability: 0.02,
      selected: false,
    },
    {
      id: "none",
      label: "No clear pattern",
      detail: "No single scam pattern stands out.",
      probability: 0.01,
      selected: false,
    },
  ],
  guidanceTitle: "What to do now",
  guidance: [
    "Do not tap links, open attachments, or scan codes in this message.",
    "Do not send codes, passwords, or payment details. A real company will not ask for those by text.",
    "If a real company is named, open their official app or site yourself and check there.",
  ],
};
