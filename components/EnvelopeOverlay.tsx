"use client";

import { useEffect, useState } from "react";
import { copy } from "../lib/translations";

type Phase = "sealed" | "opening" | "gone";

// The flap unfolds, the card slides out, then the whole scene fades. These need
// to outlast the longest CSS transition below (overlay fade ends at 2.05s).
const OPEN_DURATION_MS = 2150;
// With reduced motion the overlay simply crossfades away instead.
const REDUCED_DURATION_MS = 450;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function EnvelopeOverlay() {
  const [phase, setPhase] = useState<Phase>("sealed");

  // Hold the page still behind the envelope so a stray wheel/scroll never
  // shuffles the invitation while the seal is still closed.
  useEffect(() => {
    if (phase === "gone") return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "opening") return;

    const timer = window.setTimeout(
      () => setPhase("gone"),
      prefersReducedMotion() ? REDUCED_DURATION_MS : OPEN_DURATION_MS,
    );

    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  const open = () =>
    setPhase((current) => (current === "sealed" ? "opening" : current));

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };

  return (
    <div
      className={`envelope-overlay ${phase === "opening" ? "is-opening" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={copy.envelopeAria}
      onClick={open}
      onKeyDown={onKeyDown}
    >
      <div className="envelope-scene">
        <div className="envelope">
          <div className="env-paper" aria-hidden="true" />
          <div className="env-letter" aria-hidden="true">
            <span className="env-letter-label">{copy.envelopeLetterLabel}</span>
            <span className="env-letter-couple">{copy.couple}</span>
            <span className="env-letter-rule" />
            <span className="env-letter-date">{copy.dateLine}</span>
          </div>
          <div className="env-front" aria-hidden="true" />
          <div className="env-flap" aria-hidden="true" />
          <div className="env-seal" aria-hidden="true">
            <span className="env-seal-mono">م</span>
          </div>
        </div>
        <p className="env-hint">{copy.envelopeHint}</p>
      </div>
    </div>
  );
}
