"use client";

import { useEffect, useRef, useState } from "react";
import GradientWaves from "@/components/GradientWaves";
import ResultReport from "@/components/result-report";
import { sampleMessage, sampleReading } from "@/lib/sample-reading";
import { isScamCheckResponse, type ScamCheckResponse } from "@/lib/scam-types";
import ShinyText from "@/components/ShinyText";

const examples = [
  {
    label: "Bank alert",
    text: "OCBC Bank: Unusual sign-in on your account. It will be locked in 30 minutes unless you verify now: https://ocbc-secure-login.co/verify",
  },
  {
    label: "Held parcel",
    text: "Shopee: Your parcel is held at customs. Pay the RM20.40 release fee within 12 hours or it will be returned. bit.ly/release-pkg",
  },
  {
    label: "Family text",
    text: "Hi, it's me — new number. I lost my wallet and I'm stuck at the station. Can you transfer RM400 to this account? I'll explain later and pay you back tonight.",
  },
];

const facets = [
  {
    title: "The ask",
    body: "What it wants you to do: open a link, share a code, send money, call back.",
  },
  {
    title: "The mask",
    body: "Who it pretends to be — a bank, a courier, a boss, or someone you know.",
  },
  {
    title: "The pressure",
    body: "Deadlines, threats, and offers that only work if you move before you think.",
  },
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScamCheckResponse | null>(null);
  const [example, setExample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [shortcut, setShortcut] = useState("⌘↵");
  const requestId = useRef(0);
  const reportRef = useRef<HTMLDivElement>(null);
  const tooLong = message.length > 4000;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    setShortcut(
      /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘↵" : "Ctrl+Enter",
    );
    if (new URLSearchParams(window.location.search).get("example") === "1") {
      setExample(true);
      setResult(sampleReading);
      setMessage(sampleMessage);
    }
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!result && !error) return;
    reportRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [result, error, reducedMotion]);

  async function handleCheck() {
    const text = message.trim();
    if (!text || tooLong || loading) return;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setExample(false);
    setResult(null);

    try {
      const res = await fetch("/api/check-scam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data: unknown = await res.json();
      if (id !== requestId.current) return;

      if (!res.ok || !isScamCheckResponse(data)) {
        const messageFromApi =
          data &&
          typeof data === "object" &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "We couldn't read that message. Try again in a moment.";
        setError(messageFromApi);
        setResult(null);
        return;
      }

      setResult(data);
    } catch {
      if (id !== requestId.current) return;
      setError("We couldn't reach the checker. Try again in a moment.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function showExample() {
    setError(null);
    setLoading(false);
    requestId.current += 1;
    setExample(true);
    setResult(sampleReading);
    if (!message.trim()) setMessage(sampleMessage);
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#030605]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_115%,rgba(255,130,190,0.55),transparent_46%),radial-gradient(ellipse_at_12%_100%,rgba(120,255,180,0.38),transparent_42%)]" />
        <GradientWaves
          className="absolute inset-0 h-full w-full"
          horizonColor="#07140f"
          waveColor="#ff8ec8"
          crestColor="#e7ffe9"
          speed={reducedMotion ? 0 : 0.32}
          amplitude={2.4}
          waveScale={0.55}
          waveRatio={0.9}
          swell={32}
          turbulence={18}
          tilt={1.08}
          zoom={0.78}
          height={3.4}
          fogDepth={12}
          detail="medium"
          brightness={1}
          opacity={1}
          mouseInteraction={false}
          parallaxStrength={0.35}
          grain
          grainIntensity={0.045}
        />
        {/* <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.28)_30%,rgba(0,0,0,0.08)_58%,rgba(0,0,0,0.55)_100%)]" /> */}
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pt-6 pb-16 sm:px-8 sm:pt-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-[#c6ff6a] shadow-[0_0_18px_#c6ff6a]" />
            <span className="text-[11px] font-medium tracking-[0.22em] text-white/80 uppercase">
              Scam Check
            </span>
          </div>
          <ShinyText
            text="Powered by Jev"
            speed={10}
            delay={0}
            color="#7e7d7d"
            shineColor="#ffffff"
            spread={120}
            direction="left"
            yoyo={false}
            pauseOnHover={false}
            disabled={false}
            className="text-xs"
          />
        </header>

        <section className="mt-16 sm:mt-24">
          <p className="text-[11px] tracking-[0.22em] text-white uppercase">
            SMS · WhatsApp · email
          </p>
          <h1 className="mt-4 max-w-xl font-serif text-[3.25rem] leading-[0.92] tracking-[-0.03em] text-white sm:text-7xl">
            <span className="italic">A clear read</span>
            <br />
            on a suspicious text.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
            Paste what you received. You'll see who it pretends to be, what it
            wants, and whether the pressure is the point.
          </p>

          <div className="mt-8 rounded-[28px] border border-white/15 bg-black/40 p-3 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-4">
            <label htmlFor="message" className="sr-only">
              Message to check
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void handleCheck();
                }
              }}
              placeholder="Paste the text you received…"
              className="min-h-44 w-full resize-y bg-transparent px-3 py-3 text-base leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-1">
              <p
                className={`text-xs tabular-nums ${tooLong ? "text-rose-300" : "text-white/40"}`}
              >
                {message.length.toLocaleString()} / 4,000
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessage("")}
                  disabled={loading || message.length === 0}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-white/50 bg-transparent hover:bg-white/[0.10] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Clear input"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => void handleCheck()}
                  disabled={loading || !message.trim() || tooLong}
                  className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#eaffc7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading
                    ? "Reading…"
                    : result && !example
                      ? "Read again"
                      : "Read message"}
                  <kbd className="hidden font-sans text-[10px] tracking-wide text-current/50 sm:inline">
                    {shortcut}
                  </kbd>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/35">Try</span>
            {examples.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setMessage(item.text)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={showExample}
              className="rounded-full px-3 py-1.5 text-xs text-white/50 underline-offset-4 transition hover:text-white hover:underline"
            >
              Preview a full reading
            </button>
          </div>
        </section>

        <div ref={reportRef} className="mt-10 scroll-mt-8">
          {loading ? (
            <div className="rounded-[28px] border border-white/15 bg-black/45 px-6 py-8 backdrop-blur-2xl">
              <p className="text-[11px] tracking-[0.18em] text-white/40 uppercase">
                Reading
              </p>
              <p className="mt-3 font-serif text-3xl text-white">
                The ask, the sender, and the pressure.
              </p>
              <div className="mt-6 space-y-3">
                <div className="h-2 w-2/3 animate-pulse rounded-full bg-white/15" />
                <div className="h-2 w-full animate-pulse rounded-full bg-white/10" />
                <div className="h-2 w-5/6 animate-pulse rounded-full bg-white/10" />
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-[28px] border border-rose-300/30 bg-rose-500/10 px-6 py-5 text-sm text-rose-50 backdrop-blur-xl"
            >
              {error}
            </div>
          ) : null}

          {result ? (
            <output className="m-0 block w-full border-0 bg-transparent p-0 text-left font-sans text-inherit">
              <ResultReport
                result={result}
                message={example ? sampleMessage : message.trim()}
                example={example}
              />
            </output>
          ) : null}
        </div>

        {!result && !loading ? (
          <section className="mt-16 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-3">
            {facets.map((facet) => (
              <div key={facet.title}>
                <h2 className="font-serif text-2xl text-white">
                  {facet.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {facet.body}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        <footer className="mt-16 text-xs leading-relaxed text-white/35">
          A screening aid, not a guarantee. When money or a login is involved,
          confirm it through a channel you already trust.
        </footer>
      </main>
    </>
  );
}
