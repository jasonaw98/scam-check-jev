import { experimental_evaluate as evaluate } from "ai";
import type {
  Confidence,
  Insight,
  Pattern,
  ScamCheckResponse,
  Signal,
  Tone,
} from "@/lib/scam-types";

type ChoiceAnswer = {
  choice: string;
  probabilities?: Record<string, number>;
};

type CatalogEntry = {
  label: string;
  detail: string;
  phrase: string;
};

const SENDERS: Record<string, CatalogEntry> = {
  bank: {
    label: "A bank",
    detail: "It speaks as a bank, card issuer, or payment app.",
    phrase: "a bank or payment app",
  },
  government: {
    label: "A government agency",
    detail: "It speaks as a tax office, police, customs, or other agency.",
    phrase: "a government agency",
  },
  delivery: {
    label: "A delivery company",
    detail: "It speaks as a courier, post office, or shipping service.",
    phrase: "a delivery company",
  },
  tech_company: {
    label: "A tech company",
    detail:
      "It speaks as Apple, Google, Microsoft, a phone carrier, or similar.",
    phrase: "a technology company",
  },
  employer: {
    label: "An employer",
    detail: "It speaks as a boss, HR, or a workplace system.",
    phrase: "an employer",
  },
  friend_or_family: {
    label: "Someone you know",
    detail: "It speaks as a friend, relative, or other familiar person.",
    phrase: "someone you know",
  },
  prize: {
    label: "A prize or refund",
    detail: "It speaks as a lottery, giveaway, refund, or unexpected payout.",
    phrase: "a prize, refund, or giveaway",
  },
  unknown: {
    label: "An unnamed sender",
    detail: "It never clearly says which organization or person is writing.",
    phrase: "someone who stays vague about who they are",
  },
  none: {
    label: "No claimed sender",
    detail: "It does not pretend to be a particular organization or person.",
    phrase: "no particular organization",
  },
};

const ACTIONS: Record<string, CatalogEntry> = {
  click_link: {
    label: "Open a link",
    detail: "It wants you to tap a link, button, or web page.",
    phrase: "open a link",
  },
  share_code: {
    label: "Share a code",
    detail: "It wants a password, one-time code, or account recovery detail.",
    phrase: "hand over a code or password",
  },
  send_money: {
    label: "Send money",
    detail: "It wants a payment, transfer, gift card, or crypto.",
    phrase: "send money",
  },
  call_or_reply: {
    label: "Call or reply",
    detail:
      "It wants you to call a number or answer before you have time to check.",
    phrase: "call or reply right away",
  },
  share_info: {
    label: "Share personal details",
    detail: "It wants identity, account, or contact details.",
    phrase: "share personal details",
  },
  download: {
    label: "Install something",
    detail: "It wants you to download an app, file, or attachment.",
    phrase: "download or install something",
  },
  no_action: {
    label: "No sensitive ask",
    detail: "It is not asking you to pay, log in, or give anything private.",
    phrase: "do nothing sensitive",
  },
  unclear: {
    label: "Unclear ask",
    detail: "What it wants from you is vague or buried.",
    phrase: "do something that stays vague",
  },
};

const PATTERNS: Record<
  string,
  { label: string; detail: string; phrase: string }
> = {
  phishing: {
    label: "Phishing",
    detail:
      "A fake login, verification step, or page built to collect credentials.",
    phrase: "phishing",
  },
  financial: {
    label: "Payment",
    detail: "A push to pay, transfer, or buy gift cards or crypto.",
    phrase: "payment scam",
  },
  impersonation: {
    label: "Impersonation",
    detail: "Someone pretending to be an institution or a person you trust.",
    phrase: "impersonation",
  },
  urgency: {
    label: "Pressure",
    detail: "The main tactic is rushing you before you can think.",
    phrase: "pressure",
  },
  none: {
    label: "No clear pattern",
    detail: "No single scam pattern stands out.",
    phrase: "ordinary message",
  },
};

const SIGNAL_COPY: Record<string, { label: string; detail: string }> = {
  urgency: {
    label: "Time pressure",
    detail: "Deadlines, countdowns, or language that says to act now.",
  },
  threat: {
    label: "Threats",
    detail: "Warnings of a lockout, fine, arrest, or other harm if you wait.",
  },
  secrets: {
    label: "A request for a secret",
    detail: "Passwords, one-time codes, or account recovery details.",
  },
  payment: {
    label: "A request for money",
    detail: "A fee, transfer, gift card, or crypto payment.",
  },
  link: {
    label: "A link to follow",
    detail: "A URL, shortened link, or button that leaves the conversation.",
  },
  impersonation: {
    label: "A borrowed identity",
    detail: "It wears the name of a company, agency, or someone you know.",
  },
  too_good: {
    label: "An unexpected offer",
    detail: "A prize, refund, job, or windfall you were not waiting on.",
  },
};

const RISK_LEVELS = [
  {
    label: "Ordinary",
    explanation:
      "It reads like a normal message, with little for you to act on.",
  },
  {
    label: "Slightly off",
    explanation: "A few details feel unusual, without a strong scam pattern.",
  },
  {
    label: "Be careful",
    explanation:
      "Enough is off that you should pause before you tap, pay, or reply.",
  },
  {
    label: "Strong scam signs",
    explanation: "Several classic scam tactics show up together.",
  },
  {
    label: "Almost certainly a scam",
    explanation: "The message is built to rush you into a harmful action.",
  },
];

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

function choiceProbability(answer: ChoiceAnswer) {
  const fromDistribution = answer.probabilities?.[answer.choice];
  if (typeof fromDistribution === "number") return clamp01(fromDistribution);
  return 1;
}

function asInsight(
  answer: ChoiceAnswer,
  catalog: Record<string, CatalogEntry>,
  fallbackId: string,
): Insight {
  const id = answer.choice in catalog ? answer.choice : fallbackId;
  const entry = catalog[id] ?? catalog[fallbackId];
  return {
    id,
    label: entry.label,
    detail: entry.detail,
    probability: choiceProbability(
      answer.choice in catalog ? answer : { ...answer, choice: fallbackId },
    ),
  };
}

function asPatterns(answer: ChoiceAnswer): Pattern[] {
  const ids = Object.keys(PATTERNS);
  return ids
    .map((id) => {
      const entry = PATTERNS[id];
      const raw = answer.probabilities?.[id];
      const probability =
        typeof raw === "number" ? clamp01(raw) : answer.choice === id ? 1 : 0;
      return {
        id,
        label: entry.label,
        detail: entry.detail,
        probability,
        selected: answer.choice === id,
      };
    })
    .sort((a, b) => b.probability - a.probability);
}

function asSignal(id: string, probability: number): Signal {
  const copy = SIGNAL_COPY[id];
  const value = clamp01(probability);
  return {
    id,
    label: copy.label,
    detail: copy.detail,
    probability: value,
    active: value >= 0.45,
  };
}

function confidenceFor(
  scamProb: number,
  riskScore: number,
  isLikelyScam: boolean,
): Confidence {
  if (isLikelyScam && scamProb >= 0.85 && riskScore >= 3) return "high";
  if (!isLikelyScam && scamProb <= 0.3 && riskScore <= 1) return "high";
  if (scamProb >= 0.65 || riskScore >= 2.5 || scamProb <= 0.35) return "medium";
  return "low";
}

function toneFor(isLikelyScam: boolean, confidence: Confidence): Tone {
  if (!isLikelyScam && confidence === "low") return "caution";
  if (!isLikelyScam) return "safe";
  if (confidence === "low") return "caution";
  return "danger";
}

function headlineFor(isLikelyScam: boolean, confidence: Confidence) {
  if (isLikelyScam && confidence === "high") return "Treat this as a scam.";
  if (isLikelyScam && confidence === "medium") return "This looks like a scam.";
  if (isLikelyScam) return "This may be a scam.";
  if (confidence === "high") return "This looks legitimate.";
  if (confidence === "medium") return "This is probably fine.";
  return "This is hard to call.";
}

function buildSummary(input: {
  isLikelyScam: boolean;
  scamType: string;
  sender: Insight;
  action: Insight;
  signals: Signal[];
}) {
  const pattern = PATTERNS[input.scamType] ?? PATTERNS.none;
  const lead = input.isLikelyScam
    ? input.scamType === "none"
      ? "This still looks risky, even without one classic pattern."
      : `This looks like a ${pattern.phrase} attempt.`
    : "This does not match a clear scam pattern.";

  const senderBit =
    input.sender.id === "none"
      ? "It does not pretend to be a particular organization"
      : input.sender.id === "unknown"
        ? "The sender stays vague"
        : `It presents itself as ${SENDERS[input.sender.id]?.phrase ?? "someone else"}`;

  const actionBit =
    input.action.id === "no_action"
      ? "and it is not asking you to pay, log in, or share a code."
      : input.action.id === "unclear"
        ? "and what it wants from you stays muddy."
        : `and it is trying to get you to ${ACTIONS[input.action.id]?.phrase ?? "act"}.`;

  const loud = input.signals
    .filter((signal) => signal.probability >= 0.55)
    .slice(0, 3)
    .map((signal) => signal.label.toLowerCase());

  const loudPhrase =
    loud.length < 2
      ? loud[0]
      : loud.length === 2
        ? `${loud[0]} and ${loud[1]}`
        : `${loud.slice(0, -1).join(", ")}, and ${loud[loud.length - 1]}`;

  const flagBit = loudPhrase
    ? ` The loudest signs are ${loudPhrase}.`
    : input.isLikelyScam
      ? " The individual signs are softer, so the score comes from the overall shape of the message."
      : "";

  return `${lead} ${senderBit}, ${actionBit}${flagBit}`;
}

function guidanceFor(isLikelyScam: boolean, actionId: string) {
  if (!isLikelyScam) {
    return {
      guidanceTitle: "Still worth a pause",
      guidance: [
        "Nothing here matches a strong scam pattern. Texts can still be spoofed.",
        "If it asks you to pay, log in, or share a code, confirm that in an app or number you already trust.",
        "Ignore surprise links, even when the rest of the message looks ordinary.",
      ],
    };
  }

  const steps = [
    "Do not tap links, open attachments, or scan codes in this message.",
    "Do not send codes, passwords, or payment details. A real company will not ask for those by text.",
  ];

  if (actionId === "send_money") {
    steps.push(
      "Do not send money, gift cards, or crypto. Once it leaves, it is rarely recoverable.",
    );
  } else if (actionId === "call_or_reply") {
    steps.push(
      "Do not call the number in the message. Look the organization up yourself.",
    );
  } else if (actionId === "share_info" || actionId === "share_code") {
    steps.push(
      "Do not reply with personal details. Close the message and check the account in its official app.",
    );
  }

  steps.push(
    "If a real company is named, open their official app or site yourself and check there.",
  );

  return {
    guidanceTitle: "What to do now",
    guidance: steps.slice(0, 4),
  };
}

export async function checkScam(message: string): Promise<ScamCheckResponse> {
  const result = await evaluate({
    model: "typesafe-ai/jev",
    state: message,
    questions: {
      is_scam: {
        type: "boolean",
        instructions:
          "Is this text, SMS, WhatsApp, or email likely a scam, phishing attempt, or social-engineering attack? Weigh urgency, threats, requests for money or secrets, suspicious links, and impersonation of banks, government, delivery companies, tech brands, employers, or people the recipient knows.",
        criteria: {
          true: "Contains clear red flags of a scam or phishing",
          false: "Looks legitimate, or has no strong scam indicators",
        },
      },
      scam_type: {
        type: "choice",
        instructions:
          "What is the primary scam pattern, if any? Pick the pattern that best explains the harm, not just a side detail.",
        criteria: {
          phishing:
            "Fake login, account verification, or credential harvesting",
          financial: "Asks for money, gift cards, crypto, or bank details",
          impersonation:
            "Pretends to be a bank, government, delivery company, tech support, employer, or a known person",
          urgency:
            "The main tactic is time pressure or threats of loss, fines, or arrest",
          none: "No clear scam pattern, or the message looks legitimate",
        },
      },
      risk: {
        type: "score",
        instructions:
          "Overall risk that acting on this message would harm the recipient.",
        criteria: [
          "Clearly legitimate or low-risk",
          "Some unusual elements, but probably okay",
          "Moderately suspicious — worth caution",
          "Highly likely a scam — strong red flags",
          "Almost certainly a scam — do not act on it",
        ],
      },
      sender: {
        type: "choice",
        instructions:
          "Who does the message claim to be from? Judge the claimed identity, not whether that claim is true.",
        criteria: {
          bank: "A bank, card issuer, wallet, or payment app",
          government:
            "A government agency, tax office, police, court, or customs",
          delivery: "A courier, post office, or shipping company",
          tech_company:
            "A technology company, phone carrier, or online platform",
          employer: "An employer, boss, recruiter, or workplace system",
          friend_or_family: "A friend, relative, or other familiar person",
          prize: "A lottery, prize, refund, grant, or unexpected payout",
          unknown: "A sender who never clearly identifies themselves",
          none: "No organization or person is being claimed",
        },
      },
      action: {
        type: "choice",
        instructions:
          "What is the message primarily trying to get the recipient to do?",
        criteria: {
          click_link: "Tap a link, button, or visit a web page",
          share_code: "Provide a password, OTP, PIN, or verification code",
          send_money: "Pay, transfer, buy gift cards, or send crypto",
          call_or_reply: "Call a number or reply urgently",
          share_info:
            "Share identity, account, address, or other personal details",
          download: "Download an app, file, or attachment",
          no_action: "No sensitive action is requested",
          unclear: "The requested action is vague or missing",
        },
      },
      urgency: {
        type: "boolean",
        instructions:
          "Does the message create time pressure, a deadline, or an act-now demand?",
      },
      threat: {
        type: "boolean",
        instructions:
          "Does the message threaten account closure, legal action, arrest, fines, or other harm for not complying?",
      },
      secrets: {
        type: "boolean",
        instructions:
          "Does the message ask for a password, one-time code, PIN, or other secret?",
      },
      payment: {
        type: "boolean",
        instructions:
          "Does the message ask for money, a fee, a transfer, gift cards, or cryptocurrency?",
      },
      link: {
        type: "boolean",
        instructions:
          "Does the message include a link, shortened URL, or other prompt to open a page?",
      },
      impersonation: {
        type: "boolean",
        instructions:
          "Does the message pretend to be a known company, agency, employer, or person?",
      },
      too_good: {
        type: "boolean",
        instructions:
          "Does the message offer an unexpected prize, refund, job, investment, or windfall?",
      },
    },
  });

  const answers = result.answers;
  const scamProb = clamp01(answers.is_scam.probability);
  const riskScore = Math.min(4, Math.max(0, answers.risk.score));
  const scamType =
    answers.scam_type.choice in PATTERNS ? answers.scam_type.choice : "none";
  const isLikelyScam =
    scamProb >= 0.85 && riskScore >= 3
      ? true
      : scamProb >= 0.65 || riskScore >= 2.5
        ? true
        : scamProb <= 0.3 && riskScore <= 1
          ? false
          : scamProb > 0.5;

  const confidence = confidenceFor(scamProb, riskScore, isLikelyScam);
  const tone = toneFor(isLikelyScam, confidence);
  const riskIndex = Math.round(riskScore);
  const risk = RISK_LEVELS[riskIndex] ?? RISK_LEVELS[2];
  const sender = asInsight(answers.sender, SENDERS, "unknown");
  const action = asInsight(answers.action, ACTIONS, "unclear");
  const signals = [
    asSignal("urgency", answers.urgency.probability),
    asSignal("threat", answers.threat.probability),
    asSignal("secrets", answers.secrets.probability),
    asSignal("payment", answers.payment.probability),
    asSignal("link", answers.link.probability),
    asSignal("impersonation", answers.impersonation.probability),
    asSignal("too_good", answers.too_good.probability),
  ].sort((a, b) => b.probability - a.probability);

  const confidenceDetail =
    confidence === "high"
      ? "The signals agree with each other."
      : confidence === "medium"
        ? "The signals mostly agree, with some ambiguity."
        : "The signals conflict. Treat this as a hint, not a final verdict.";

  const { guidanceTitle, guidance } = guidanceFor(isLikelyScam, action.id);
  const pattern = PATTERNS[scamType];

  return {
    verdict: isLikelyScam ? "LIKELY_SCAM" : "LIKELY_LEGIT",
    tone,
    headline: headlineFor(isLikelyScam, confidence),
    isLikelyScam,
    scamProbability: round3(scamProb),
    riskScore: Math.round(riskScore * 100) / 100,
    riskLabel: risk.label,
    riskExplanation: risk.explanation,
    scamType,
    scamTypeLabel: pattern.label,
    confidence,
    confidenceDetail,
    summary: buildSummary({
      isLikelyScam,
      scamType,
      sender,
      action,
      signals,
    }),
    claimedSender: sender,
    requestedAction: action,
    signals,
    patterns: asPatterns(answers.scam_type),
    guidanceTitle,
    guidance,
  };
}
