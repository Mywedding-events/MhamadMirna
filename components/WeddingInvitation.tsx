"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import EnvelopeOverlay from "./EnvelopeOverlay";
import { copy, registryPhoneNumber } from "../lib/translations";

// The single invitation photo is the only background art, so it is hard-wired
// here (and preloaded in the document <head>) rather than discovered at runtime.
// The browser fetches it while the sealed envelope is still on screen, so the
// moment a guest breaks the seal the photo is already loaded behind it.
const backgroundImage = "/uploads/1.jpeg";

// Warm ivory/cream sampled from the invitation photo (flat field ≈ #e6ded3).
// It sits behind and around the artwork — the desktop letterbox and the
// pre-decode backdrop — so the chrome blends into the paper instead of ringing
// it with a contrasting colour.
const chromeColor = "#e6ded3";

const sectionCount = 6;

type RsvpStatus = "pending" | "accepted" | "rejected";

type Invitee = {
  id: string;
  fullName?: string;
  status?: RsvpStatus;
};

type InvitationResponse = {
  invitationCode?: string;
  invitees?: Invitee[];
};

const API_BASE_URL = "https://api.mywedding.events";

// Errors are kept as a kind rather than a finished sentence so the copy deck
// owns the wording shown to guests.
type ErrorKind = "notFound" | "loadFailed" | "rsvpFailed";

type RequestError = {
  kind: ErrorKind;
  apiMessage?: string;
};

class InvitationRequestError extends Error {
  readonly kind: ErrorKind;
  readonly apiMessage?: string;

  constructor(kind: ErrorKind, apiMessage?: string) {
    super(apiMessage ?? kind);
    this.kind = kind;
    this.apiMessage = apiMessage;
  }
}

// October 5, 2026 at 7:00 PM Lebanon time (UTC+3 while EEST is in effect).
const weddingTimestamp = new Date("2026-10-05T19:00:00+03:00").getTime();

type Countdown = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

function getCountdown(): Countdown {
  const remainingSeconds = Math.max(
    0,
    Math.floor((weddingTimestamp - Date.now()) / 1000),
  );
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    days: pad(Math.floor(remainingSeconds / 86400)),
    hours: pad(Math.floor((remainingSeconds % 86400) / 3600)),
    minutes: pad(Math.floor((remainingSeconds % 3600) / 60)),
    seconds: pad(remainingSeconds % 60),
  };
}

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="9"
        width="28"
        height="25"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6 16h28M13 5v7M27 5v7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LocationIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="44"
      viewBox="0 0 40 44"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 3C12.8 3 7 8.8 7 16c0 9 13 24 13 24s13-15 13-24c0-7.2-5.8-13-13-13z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="20" cy="16" r="4.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

function ButtonLink({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      className={`inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[2px] border border-[var(--gold-line)] bg-white/[0.04] px-[26px] py-[13px] font-body-wedding text-[16px] tracking-[0.08em] text-[var(--ink)] no-underline transition duration-300 ease-in-out hover:border-[var(--ink)] hover:bg-white/[0.14] active:scale-95 ${className}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

function RsvpButton({
  label,
  variant,
  active,
  onClick,
}: {
  label: string;
  variant: "accept" | "decline";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex min-w-[82px] cursor-pointer items-center justify-center rounded-[2px] border px-[13px] py-[9px] font-serif-wedding text-[13px] tracking-[0.06em] transition duration-300 active:scale-95 ${
        active
          ? variant === "accept"
            ? "border-transparent bg-[oklch(0.82_0.075_78/0.9)] font-semibold text-[#3a2615]"
            : "border-transparent bg-[rgba(252,246,238,0.92)] font-semibold text-[#4a3220]"
          : "border-[var(--gold-line)] bg-white/[0.04] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-white/[0.14]"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const STARTUP_TIMEOUT_MS = 6000;

function waitForWindowLoad(signal: AbortSignal) {
  if (document.readyState === "complete") return Promise.resolve();

  return new Promise<void>((resolve) => {
    const done = () => resolve();
    window.addEventListener("load", done, { once: true, signal });
  });
}

function waitForStylesheet(link: HTMLLinkElement, signal: AbortSignal) {
  if (link.sheet) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const done = () => resolve();
    link.addEventListener("load", done, { once: true, signal });
    link.addEventListener("error", done, { once: true, signal });
  });
}

async function waitForPageAssets(signal: AbortSignal) {
  const stylesheetLinks = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'),
  );
  const ready = async () => {
    await Promise.all([
      waitForWindowLoad(signal),
      ...stylesheetLinks.map((link) => waitForStylesheet(link, signal)),
    ]);
    if ("fonts" in document) await document.fonts.ready;
  };
  const timeout = new Promise<void>((resolve) =>
    window.setTimeout(resolve, STARTUP_TIMEOUT_MS),
  );

  await Promise.race([ready(), timeout]);
}

export default function WeddingInvitation({
  invitationCode,
}: {
  invitationCode?: string;
}) {
  const [appReady, setAppReady] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [cueHidden, setCueHidden] = useState(false);
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RsvpStatus>>({});
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState<RequestError | null>(
    null,
  );
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<RequestError | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const lockRef = useRef(false);
  const currentRef = useRef(0);
  const touchStartRef = useRef<number | null>(null);
  const sectionIds = useMemo(
    () =>
      Array.from({ length: sectionCount }, (_, index) => `section-${index + 1}`),
    [],
  );
  const normalizedInvitationCode = invitationCode?.trim();
  const countdownUnits = [
    { key: "days", label: copy.countdown.days, value: countdown?.days },
    { key: "hours", label: copy.countdown.hours, value: countdown?.hours },
    { key: "minutes", label: copy.countdown.minutes, value: countdown?.minutes },
    { key: "seconds", label: copy.countdown.seconds, value: countdown?.seconds },
  ];

  const describeError = (error: RequestError) => {
    // API messages only ever arrive in English, so they are replaced by our own
    // Arabic copy here.
    if (error.kind === "notFound")
      return copy.invitationNotFound(normalizedInvitationCode ?? "");
    if (error.kind === "rsvpFailed") return copy.rsvpFailed;

    return copy.invitationLoadFailed;
  };

  useEffect(() => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    document.title = copy.documentTitle;
  }, []);

  useEffect(() => {
    setCountdown(getCountdown());

    const countdownTimer = window.setInterval(
      () => setCountdown(getCountdown()),
      1000,
    );

    return () => window.clearInterval(countdownTimer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    waitForPageAssets(controller.signal)
      .catch(() => undefined)
      .then(() => {
        if (controller.signal.aborted) return;
        document.body.style.visibility = "visible";
        setAppReady(true);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!appReady) return;

    const themeColorMeta =
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ??
      document.head.appendChild(document.createElement("meta"));

    // Browser chrome stays on the page colour; the in-page backdrop keeps the
    // warm-ivory chrome colour (matched by --slide-chrome-color in globals.css).
    themeColorMeta.name = "theme-color";
    themeColorMeta.content = "#f6f2ec";
  }, [appReady]);

  useEffect(() => {
    if (!appReady) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    const dotButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>("[data-dot]"),
    );

    const revealSection = (section: HTMLElement) => {
      if (section.dataset.revealed === "true") return;
      section.dataset.revealed = "true";
      if (reducedMotion) return;

      section
        .querySelectorAll<HTMLElement>(".reveal")
        .forEach((element, index) => {
          const delay = Math.min(index, 5) * 90;
          element.classList.add("go");
          element.style.transitionDelay = `${delay}ms`;
          window.requestAnimationFrame(() => element.classList.remove("pre"));
          window.setTimeout(() => {
            element.style.transition = "none";
            element.style.transitionDelay = "0ms";
            element.classList.remove("pre");
            element.style.opacity = "1";
            element.style.transform = "none";
          }, 900 + delay);
        });
    };

    if (!reducedMotion) {
      document
        .querySelectorAll(".reveal")
        .forEach((element) => element.classList.add("pre"));
    }

    const syncActiveSection = () => {
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      sectionElements.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(
          rect.top + rect.height / 2 - viewportHeight / 2,
        );
        if (distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
      });

      currentRef.current = best;
      setActiveSection(best);
    };

    const revealVisibleSections = () => {
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      sectionElements.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (
          rect.top < viewportHeight * 0.85 &&
          rect.bottom > viewportHeight * 0.15
        )
          revealSection(section);
      });
      syncActiveSection();
    };

    const goTo = (index: number) => {
      const next = Math.max(0, Math.min(sectionElements.length - 1, index));
      if (next === currentRef.current && lockRef.current) return;
      currentRef.current = next;
      lockRef.current = true;
      revealSection(sectionElements[next]);
      setActiveSection(next);
      window.scrollTo({
        top: sectionElements[next].offsetTop,
        behavior: reducedMotion ? "auto" : "smooth",
      });
      window.setTimeout(() => {
        lockRef.current = false;
      }, 760);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (lockRef.current) return;
      if (event.deltaY > 8) goTo(currentRef.current + 1);
      if (event.deltaY < -8) goTo(currentRef.current - 1);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goTo(currentRef.current + 1);
      } else if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goTo(currentRef.current - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(sectionElements.length - 1);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (event: TouchEvent) => {
      event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (touchStartRef.current === null || lockRef.current) return;
      const distance =
        touchStartRef.current -
        (event.changedTouches[0]?.clientY ?? touchStartRef.current);
      if (Math.abs(distance) > 40)
        goTo(currentRef.current + (distance > 0 ? 1 : -1));
      touchStartRef.current = null;
    };

    const onResize = () => {
      syncActiveSection();
      window.scrollTo({
        top: sectionElements[currentRef.current]?.offsetTop ?? 0,
      });
      revealVisibleSections();
    };

    const onScroll = () => {
      setCueHidden(window.scrollY > 40);
      revealVisibleSections();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const onDotClick = (event: Event) => {
      const index = Number(
        (event.currentTarget as HTMLButtonElement).dataset.index ?? "0",
      );
      goTo(index);
    };

    dotButtons.forEach((button) =>
      button.addEventListener("click", onDotClick),
    );

    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting)
              revealSection(entry.target as HTMLElement);
          });
          syncActiveSection();
        },
        { threshold: [0, 0.2, 0.6] },
      );
      sectionElements.forEach((section) => observer?.observe(section));
    }

    revealVisibleSections();
    const firstFallback = window.setTimeout(revealVisibleSections, 200);
    const secondFallback = window.setTimeout(revealVisibleSections, 800);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      dotButtons.forEach((button) =>
        button.removeEventListener("click", onDotClick),
      );
      observer?.disconnect();
      window.clearTimeout(firstFallback);
      window.clearTimeout(secondFallback);
    };
  }, [appReady, sectionIds]);

  useEffect(() => {
    if (!normalizedInvitationCode) {
      setInvitees([]);
      setRsvps({});
      setInvitationError(null);
      setConfirmed(false);
      return;
    }

    const controller = new AbortController();

    setInvitationLoading(true);
    setInvitationError(null);
    setRsvpError(null);
    setConfirmed(false);

    fetch(
      `${API_BASE_URL}/api/invitations/${encodeURIComponent(
        normalizedInvitationCode,
      )}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) {
          const errorBody = (await response
            .json()
            .catch(() => undefined)) as { message?: string } | undefined;
          throw new InvitationRequestError("notFound", errorBody?.message);
        }

        return response.json() as Promise<InvitationResponse>;
      })
      .then((invitation) => {
        const fetchedInvitees = invitation.invitees ?? [];
        setInvitees(fetchedInvitees);
        setRsvps(
          Object.fromEntries(
            fetchedInvitees.map((invitee) => [
              invitee.id,
              invitee.status ?? "pending",
            ]),
          ),
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setInvitees([]);
        setRsvps({});
        setInvitationError(
          error instanceof InvitationRequestError
            ? { kind: error.kind, apiMessage: error.apiMessage }
            : { kind: "loadFailed" },
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setInvitationLoading(false);
      });

    return () => controller.abort();
  }, [normalizedInvitationCode]);

  const selectRsvp = (inviteeId: string, value: RsvpStatus) => {
    setConfirmed(false);
    setRsvpError(null);
    setRsvps((current) => ({ ...current, [inviteeId]: value }));
  };

  const submitRsvps = async () => {
    if (!normalizedInvitationCode || invitees.length === 0) return;

    setSubmittingRsvp(true);
    setConfirmed(false);
    setRsvpError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/invitations/${encodeURIComponent(
          normalizedInvitationCode,
        )}/rsvp`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitees: invitees.map((invitee) => ({
              inviteeId: invitee.id,
              status: rsvps[invitee.id] ?? "pending",
            })),
          }),
        },
      );

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => undefined)) as
          | { message?: string }
          | undefined;
        throw new InvitationRequestError("rsvpFailed", errorBody?.message);
      }

      const updatedInvitation =
        (await response.json()) as InvitationResponse;
      const updatedInvitees = updatedInvitation.invitees ?? invitees;
      setInvitees(updatedInvitees);
      setRsvps(
        Object.fromEntries(
          updatedInvitees.map((invitee) => [
            invitee.id,
            invitee.status ?? "pending",
          ]),
        ),
      );
      setConfirmed(true);
    } catch (error) {
      setRsvpError(
        error instanceof InvitationRequestError
          ? { kind: error.kind, apiMessage: error.apiMessage }
          : { kind: "rsvpFailed" },
      );
    } finally {
      setSubmittingRsvp(false);
    }
  };

  return (
    <>
      <EnvelopeOverlay />
      {/* The invitation photo is rendered (and preloaded) from the very first
          paint, sitting behind the sealed envelope, so it is already loaded the
          instant a guest breaks the seal — no pop-in on open. */}
      <div
        className="fixed inset-0 z-0 bg-fallback"
        style={{ backgroundColor: chromeColor }}
        aria-hidden="true"
      >
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized
          className="scale-105 object-cover object-[center_30%] saturate-[1] md:scale-110 md:blur-[10px]"
        />
        <Image
          src={backgroundImage}
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized
          className="hidden object-contain object-center saturate-[1] md:block"
        />
      </div>
      {/* No dimming veil and no brightness trim: the photo renders at its
          natural brightness. The copy sits on top in deep sage ink
          (--ink / #465448) with no text-shadow block behind the glyphs. */}

      <main className="relative z-[2]">
        <section
          id={sectionIds[0]}
          className="relative flex min-h-svh flex-col items-center justify-center px-7 pb-[120px] pt-24 text-center"
          data-screen-label="01 Welcome"
        >
          <div className="w-full max-w-[560px]">
            <p className="reveal text-shadow-wedding font-arabic-wedding mx-auto mb-[clamp(18px,6vw,30px)] max-w-[500px] text-[clamp(19px,5.4vw,28px)] leading-[1.8] text-[var(--gold)]">
              {copy.basmala}
            </p>
            <p className="reveal text-shadow-wedding font-arabic-wedding mx-auto mb-[clamp(20px,7vw,34px)] max-w-[500px] text-[clamp(15px,4.4vw,20px)] leading-[1.9] text-[var(--ink-soft)]">
              {copy.verse[0]}
              <br />
              {copy.verse[1]}
            </p>
            <h1 className="reveal text-shadow-wedding font-script my-[0.06em] pb-[0.1em] text-[clamp(44px,12.5vw,86px)] leading-[1.06] text-[var(--ink)]">
              {copy.couple}
            </h1>
            <div className="wedding-rule reveal" />
            <p className="reveal text-shadow-wedding font-serif-wedding text-[clamp(13px,3.6vw,16px)] uppercase leading-[1.4] tracking-[0.2em] text-[var(--ink-soft)]">
              {copy.dateLine}
            </p>
            <div className="reveal mt-[clamp(26px,8vw,44px)] flex items-start justify-center gap-[clamp(6px,2.5vw,18px)]">
              {countdownUnits.map((unit) => (
                <div
                  key={unit.key}
                  className="flex min-w-[clamp(52px,15vw,74px)] flex-col items-center"
                >
                  <span
                    dir="ltr"
                    className="text-shadow-wedding font-numerals-wedding text-[clamp(34px,10vw,56px)] leading-none tabular-nums text-[var(--ink)]"
                  >
                    {unit.value ?? "--"}
                  </span>
                  <span className="text-shadow-wedding mt-[10px] font-serif-wedding text-[clamp(10px,2.8vw,12px)] uppercase leading-none tracking-[0.22em] text-[var(--ink-soft)]">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            className={`text-shadow-wedding absolute bottom-[46px] left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 text-[var(--ink-soft)] transition-opacity duration-500 ${cueHidden ? "opacity-0" : "opacity-100"}`}
            type="button"
            onClick={() =>
              document
                .getElementById(sectionIds[1])
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="text-[13px] uppercase tracking-[0.3em]">
              {copy.scrollCue}
            </span>
            <svg
              className="animate-bob"
              width="22"
              height="13"
              viewBox="0 0 22 13"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1l10 10L21 1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </section>

        <section
          id={sectionIds[1]}
          className="flex min-h-svh flex-col items-center justify-center px-7 pb-[120px] pt-24 text-center"
          data-screen-label="02 Invitation"
        >
          <div className="w-full max-w-[430px]">
            <p className="reveal text-shadow-wedding mb-4 font-script text-[clamp(42px,11vw,50px)] leading-[1.05] text-(--ink)">
              {copy.coupleStacked[0]}
              <br />
              {copy.coupleStacked[1]}
              <br />
              {copy.coupleStacked[2]}
            </p>
            <p className="reveal text-shadow-wedding font-body-wedding text-[17px] leading-[1.75] text-[var(--ink)]">
              {copy.invitationBody[0]}
              <br />
              {copy.invitationBody[1]}
            </p>
            <p className="reveal text-shadow-wedding font-body-wedding text-[17px] leading-[1.75] text-[var(--ink)]">
              {copy.weddingDate}
            </p>
          </div>
        </section>

        <section
          id={sectionIds[2]}
          className="flex min-h-svh flex-col items-center justify-center px-7 py-12 text-center min-[390px]:pb-[120px] min-[390px]:pt-24 max-[380px]:px-5 max-[380px]:py-8 max-[380px]:min-h-dvh"
          data-screen-label="03 Ceremony"
        >
          <div className="flex w-full max-w-[430px] flex-col items-center">
            <h2 className="reveal text-shadow-wedding font-script text-[clamp(42px,12vw,64px)] leading-[1.04] text-(--ink)">
              {copy.ceremonyTitle}
            </h2>
            <div className="wedding-rule reveal my-4 max-[380px]:my-3" />
            <CalendarIcon className="reveal mx-auto block h-9 w-9 text-(--ink) drop-shadow-[0_2px_8px_rgba(30,18,10,0.45)] min-[390px]:h-10 min-[390px]:w-10" />
            <p className="reveal text-shadow-wedding font-body-wedding mt-1 text-[17px] leading-[1.55] tracking-[0.04em] text-(--ink) min-[390px]:mt-1.5 min-[390px]:leading-[1.75]">
              {copy.weddingDate}
            </p>
            <p className="reveal text-shadow-wedding font-body-wedding text-[17px] leading-[1.55] tracking-[0.04em] text-(--ink) min-[390px]:leading-[1.75]">
              {copy.ceremonyTime}
            </p>
            <LocationIcon className="reveal mx-auto mt-5 block h-10 w-9 text-(--ink) drop-shadow-[0_2px_8px_rgba(30,18,10,0.45)] min-[390px]:mt-[30px] min-[390px]:h-11 min-[390px]:w-10" />
            <p className="reveal text-shadow-wedding mt-1 font-serif-wedding text-[22px] leading-[1.55] text-(--ink) min-[390px]:leading-[1.75]">
              {copy.venue}
            </p>
            <ButtonLink
              className="reveal mt-4 max-[380px]:px-5 max-[380px]:py-[11px] max-[380px]:text-sm min-[390px]:mt-[18px]"
              href="https://maps.app.goo.gl/hdx3n2FUuPiWfUDh8"
            >
              {copy.venueLink}
            </ButtonLink>
          </div>
        </section>

        <section
          id={sectionIds[3]}
          className="flex min-h-svh flex-col items-center justify-center px-7 py-12 text-center min-[390px]:pb-[120px] min-[390px]:pt-24 max-[380px]:px-5 max-[380px]:py-8 max-[380px]:min-h-dvh"
          data-screen-label="04 Registry"
        >
          <div className="flex w-full max-w-[430px] flex-col items-center">
            <h2 className="reveal text-shadow-wedding font-script text-[clamp(42px,12vw,64px)] leading-[1.04] text-(--ink)">
              {copy.registryTitle}
            </h2>
            <div className="wedding-rule reveal my-4 max-[380px]:my-3" />
            <div className="reveal relative w-full overflow-hidden rounded-[3px] border border-(--gold-line) bg-[rgba(76,49,33,0.42)] px-5 py-6 shadow-[0_16px_48px_rgba(24,14,8,0.3)] backdrop-blur-[2px] before:pointer-events-none before:absolute before:inset-[6px] before:border before:border-[rgba(252,246,238,0.16)] min-[390px]:px-6 min-[390px]:py-7 max-[380px]:px-4 max-[380px]:py-5">
              <p className="relative text-shadow-wedding font-serif-wedding text-[17px] leading-[1.7] text-(--ink)">
                {copy.registryPresence}
              </p>
              <p className="relative text-shadow-wedding font-serif-wedding mt-3 text-[17px] leading-[1.7] text-(--ink)">
                {copy.registryIntro}
              </p>
              <div className="wedding-rule relative my-4 min-[390px]:my-5" />
              <div className="relative text-shadow-wedding">
                <p className="font-serif-wedding text-[17px] leading-8 text-(--ink)">
                  {copy.registryPhoneLabel}{" "}
                  <span dir="ltr">{registryPhoneNumber}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id={sectionIds[4]}
          className="flex min-h-svh flex-col items-center justify-center px-7 pb-[120px] pt-24 text-center"
          data-screen-label="05 RSVP"
        >
          <div className="w-full max-w-[430px]">
            <h2 className="reveal text-shadow-wedding font-script text-[clamp(30px,8vw,38px)] leading-[1.04] text-[var(--ink)]">
              {copy.rsvpTitle}
            </h2>
            <p className="reveal text-shadow-wedding mt-1.5 font-serif-wedding text-[15px] tracking-[0.04em] text-[var(--ink-soft)]">
              {copy.rsvpDeadline}
            </p>
            {/* Italic is skipped here: the Naskh face has no italic cut and the
                browser would slant it synthetically. */}
            <p className="reveal text-shadow-wedding mx-auto mt-2.5 max-w-[340px] font-serif-wedding text-[14px] leading-[1.6] tracking-[0.03em] text-[var(--ink-soft)]">
              {copy.adultsOnlyNote}
            </p>
            <div className="wedding-rule reveal" />
            <p className="reveal text-shadow-wedding my-1.5 mb-[18px] font-serif-wedding text-[15px] tracking-[0.04em] text-[var(--ink-soft)]">
              {copy.guestCountLabel}{" "}
              <b className="font-semibold text-[var(--ink)]">
                {invitees.length}
              </b>
            </p>
            {invitationLoading ? (
              <p className="reveal text-shadow-wedding text-[17px] italic text-[var(--ink-soft)]">
                {copy.loadingInvitation}
              </p>
            ) : invitationError ? (
              <p className="reveal text-shadow-wedding text-[17px] italic text-[var(--ink-soft)]">
                {describeError(invitationError)}
              </p>
            ) : invitees.length > 0 ? (
              <>
                <div className="reveal space-y-3">
                  {invitees.map((invitee) => (
                    <div
                      key={invitee.id}
                      className="flex items-center justify-between gap-3 border-y border-[rgba(252,246,238,0.16)] py-3 text-left"
                    >
                      <span className="text-shadow-wedding font-serif-wedding text-[15px] text-[var(--ink)]">
                        {invitee.fullName ?? copy.guestFallbackName}
                      </span>
                      <div className="flex gap-2">
                        <RsvpButton
                          label={copy.accept}
                          variant="accept"
                          active={rsvps[invitee.id] === "accepted"}
                          onClick={() => selectRsvp(invitee.id, "accepted")}
                        />
                        <RsvpButton
                          label={copy.decline}
                          variant="decline"
                          active={rsvps[invitee.id] === "rejected"}
                          onClick={() => selectRsvp(invitee.id, "rejected")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="reveal mt-[30px] inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[2px] border border-[var(--gold-line)] bg-white/[0.04] px-[26px] py-[13px] font-serif-wedding text-[13px] tracking-[0.06em] text-[var(--ink)] transition duration-300 hover:border-[var(--ink)] hover:bg-white/[0.14] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={submitRsvps}
                  disabled={submittingRsvp}
                >
                  {submittingRsvp ? copy.confirming : copy.confirm}
                </button>
                {rsvpError ? (
                  <p className="text-shadow-wedding mt-5 min-h-6 text-lg italic text-[var(--ink-soft)]">
                    {describeError(rsvpError)}
                  </p>
                ) : (
                  <p
                    className={`text-shadow-wedding mt-5 min-h-6 text-lg italic text-[var(--gold)] transition-opacity duration-500 ${confirmed ? "opacity-100" : "opacity-0"}`}
                  >
                    {copy.rsvpThanks}
                  </p>
                )}
              </>
            ) : (
              <p className="reveal text-shadow-wedding text-[17px] italic text-[var(--ink-soft)]">
                {copy.noInvitationCode}
              </p>
            )}
          </div>
        </section>

        <section
          id={sectionIds[5]}
          className="flex min-h-svh flex-col items-center justify-center px-7 pb-[120px] pt-24 text-center"
          data-screen-label="06 Together"
        >
          <div className="flex w-full max-w-[430px] flex-col items-center">
            <h2 className="reveal text-shadow-wedding font-script text-[clamp(46px,13vw,62px)] leading-[1.04] text-[var(--ink)]">
              {copy.closingTitle[0]}
              <br />
              {copy.closingTitle[1]}
            </h2>
          </div>
        </section>
      </main>

      <nav
        className="fixed right-[18px] top-1/2 z-30 flex -translate-y-1/2 flex-col gap-[13px]"
        aria-label={copy.navAria}
      >
        {copy.sections.map((section, index) => (
          <button
            key={sectionIds[index]}
            data-dot
            data-index={index}
            className={`h-[9px] w-[9px] cursor-pointer rounded-full border p-0 transition duration-300 ${
              activeSection === index
                ? "scale-125 border-[var(--gold)] bg-[var(--gold)]"
                : "border-[rgba(252,246,238,0.7)] bg-transparent"
            }`}
            type="button"
            aria-label={copy.goToSection(index + 1, section)}
          />
        ))}
      </nav>
    </>
  );
}
