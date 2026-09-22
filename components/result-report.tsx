"use client";

import { useEffect, useState } from "react";
import type { ScamCheckResponse, Tone } from "@/lib/scam-types";

const toneStyles: Record<
  Tone,
  { badge: string; bar: string; ring: string; ink: string }
> = {
  danger: {
    badge: "bg-rose-400/15 text-rose-100 ring-rose-300/30",
    bar: "bg-rose-300",
    ring: "#fb7185",
    ink: "text-rose-100",
  },
  caution: {
    badge: "bg-amber-300/15 text-amber-50 ring-amber-200/30",
    bar: "bg-amber-200",
    ring: "#fcd34d",
    ink: "text-amber-50",
  },
  safe: {
    badge: "bg-emerald-300/15 text-emerald-50 ring-emerald-200/30",
    bar: "bg-emerald-200",
    ring: "#6ee7b7",
    ink: "text-emerald-50",
  },
};

function formatPercent(value: number) {
  const pct = value * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

function Meter({ value, className }: { value: number; className: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="h-1 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${className}`}
        style={{
          width: ready
            ? `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%`
            : "0%",
        }}
      />
    </div>
  );
}

function ProbabilityRing({ value, color }: { value: number; color: string }) {
  const shown = Math.round(value * 100);
  return (
    <div
      className="relative grid size-28 shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${color} ${shown * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
      }}
      aria-hidden
    >
      <div className="flex size-[5.35rem] flex-col items-center justify-center rounded-full bg-[#070b09]">
        <span className="text-[1.65rem] leading-none tracking-tight text-white">
          {shown}
          <span className="text-lg text-white/70">%</span>
        </span>
      </div>
    </div>
  );
}

export default function ResultReport({
  result,
  message,
  example = false,
}: {
  result: ScamCheckResponse;
  message: string;
  example?: boolean;
}) {
  const tone = toneStyles[result.tone];
  const confidence =
    result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1);

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/15 bg-black/50 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div className="border-b border-white/10 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ring-1 ${tone.badge}`}
          >
            {result.verdict === "LIKELY_SCAM"
              ? "Likely scam"
              : "Likely legitimate"}
          </p>
          <p className="text-xs text-white/50">{confidence} confidence</p>
        </div>
        {example ? (
          <p className="mt-3 text-xs text-white/45">
            Example reading of a fake bank text. Your own message replaces this.
          </p>
        ) : null}
      </div>

      <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProbabilityRing value={result.scamProbability} color={tone.ring} />
          <p className="sr-only">
            Scam probability {formatPercent(result.scamProbability)}
          </p>
          <div className="min-w-0">
            <h2
              className={`font-serif text-4xl leading-none tracking-tight sm:text-5xl ${tone.ink}`}
            >
              {result.headline}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/75">
              {result.summary}
            </p>
          </div>
        </div>

        <blockquote className="line-clamp-4 border-l border-white/20 pl-4 text-sm leading-relaxed text-white/60">
          {message}
        </blockquote>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white">
              Risk
            </p>
            <p className="mt-2 text-2xl text-white">
              {result.riskScore.toFixed(1)}
              <span className="text-base text-white"> / 4</span>
            </p>
            <p className="mt-1 text-sm text-white/70">{result.riskLabel}</p>
            <div className="mt-3">
              <Meter value={result.riskScore / 4} className={tone.bar} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/50">
              {result.riskExplanation}
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white">
              Primary pattern
            </p>
            <p className="mt-2 text-2xl text-white tracking-tight">
              {result.scamTypeLabel}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/50">
              {result.patterns.find((pattern) => pattern.selected)?.detail}
            </p>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white">
              Confidence
            </p>
            <p className="mt-2 text-2xl text-white">{confidence}</p>
            <p className="mt-3 text-xs leading-relaxed text-white/50">
              {result.confidenceDetail}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InsightCard
            kicker="What it wants"
            label={result.requestedAction.label}
            detail={result.requestedAction.detail}
            probability={result.requestedAction.probability}
            barClass={tone.bar}
          />
          <InsightCard
            kicker="Who it claims to be"
            label={result.claimedSender.label}
            detail={result.claimedSender.detail}
            probability={result.claimedSender.probability}
            barClass={tone.bar}
          />
        </div>

        <section>
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-white">
            Signs in this message
          </h3>
          <ul className="mt-3 divide-y divide-white/10">
            {result.signals.map((signal) => (
              <li
                key={signal.id}
                className="grid gap-2 py-3 sm:grid-cols-[1fr_7rem] sm:items-center"
              >
                <div className={signal.active ? "" : "opacity-45"}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm text-white">{signal.label}</p>
                    <p className="text-xs tabular-nums text-white/50 sm:hidden">
                      {formatPercent(signal.probability)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">
                    {signal.detail}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <Meter
                      value={signal.probability}
                      className={signal.active ? tone.bar : "bg-white/35"}
                    />
                  </div>
                  <p className="hidden w-10 text-right text-xs tabular-nums text-white/55 sm:block">
                    {formatPercent(signal.probability)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-[11px] uppercase tracking-[0.16em] text-white/40">
            How the patterns compare
          </h3>
          <ul className="mt-4 space-y-3">
            {result.patterns.map((pattern) => (
              <li key={pattern.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="text-sm text-white/85">
                    {pattern.label}
                    {pattern.selected ? (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-white/40">
                        Primary
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs tabular-nums text-white/50">
                    {formatPercent(pattern.probability)}
                  </p>
                </div>
                <Meter
                  value={pattern.probability}
                  className={pattern.selected ? tone.bar : "bg-white/40"}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
          <h3 className="font-serif text-2xl text-white">
            {result.guidanceTitle}
          </h3>
          <ol className="mt-4 space-y-3">
            {result.guidance.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 text-sm leading-relaxed text-white/75"
              >
                <span className="mt-0.5 font-serif text-white/40">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}

function InsightCard({
  kicker,
  label,
  detail,
  probability,
  barClass,
}: {
  kicker: string;
  label: string;
  detail: string;
  probability: number;
  barClass: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/80">
        {kicker}
      </p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="text-2xl tracking-tight text-white">{label}</p>
        <p className="text-xs tabular-nums text-white/50">
          {formatPercent(probability)}
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{detail}</p>
      <div className="mt-4">
        <Meter value={probability} className={barClass} />
      </div>
    </div>
  );
}
