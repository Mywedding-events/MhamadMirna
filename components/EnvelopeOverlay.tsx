"use client";

import { useEffect, useState } from "react";
import { copy } from "../lib/translations";

type Phase = "sealed" | "opening" | "gone";

// The face fades, then the four flaps unfold outward. This must outlast the
// slowest flap (bottom: 0.57s delay + 1s transition = 1.57s).
const OPEN_DURATION_MS = 1750;
// With reduced motion the whole envelope simply crossfades away instead.
const REDUCED_DURATION_MS = 480;

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
      <div className="env-stage">
        <div className="env-flap env-flap-top" aria-hidden="true" />
        <div className="env-flap env-flap-bottom" aria-hidden="true" />
        <div className="env-flap env-flap-left" aria-hidden="true" />
        <div className="env-flap env-flap-right" aria-hidden="true" />

        <div className="env-face">
          <div className="env-vignette" aria-hidden="true" />
          <svg
            className="env-seams"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
            <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
          </svg>

          <div className="env-couple-block">
            <span className="env-label">{copy.envelopeLetterLabel}</span>
            <span className="env-couple">{copy.couple}</span>
          </div>

          <div className="env-seal" aria-hidden="true">
            <span className="env-seal-mono">م</span>
          </div>

          <p className="env-hint">{copy.envelopeHint}</p>
        </div>
      </div>
    </div>
  );
}
