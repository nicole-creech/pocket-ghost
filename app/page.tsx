"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ActionPanel from "@/components/ActionPanel";
import DialogueBubble from "@/components/DialogueBubble";
import GhostPet from "@/components/GhostPet";
import SidebarSection from "@/components/SidebarSection";
import CompactStatChip from "@/components/CompactStatChip";
import MiniStatusBar from "@/components/MiniStatusBar";
import {
  DEFAULT_PET,
  getCancelledFocusDialogue,
  getContextualDialogue,
  getFocusCompleteDialogue,
  getStatsAwareDialogue,
  getWelcomeBackDialogue,
} from "@/lib/pet-data";
import { browserCompanionStorage } from "@/lib/companion-storage";
import {
  cancelFocusSession,
  clamp,
  FOCUS_NUDGE_EVERY_SECONDS,
  formatTime,
  getFocusNudge,
  pauseFocusSession,
  restoreSavedFocusSession,
  resumeFocusSession,
  startFocusSession,
  tickFocusSession,
} from "@/lib/focus-controller";
import {
  FocusSession,
  FocusSessionHistoryEntry,
  InteractionType,
  Pet,
} from "@/lib/types";
import {
  getTodayMinutes,
  getTodaySessions,
  getCurrentStreak,
} from "@/lib/focusStats";

const FOCUS_DURATION_MINUTES = 25;
const FOCUS_DURATION_SECONDS = FOCUS_DURATION_MINUTES * 60;
const AUTO_PAUSE_AFTER_SECONDS = 5 * 60;
const AMBIENT_DIALOGUE_EVERY_MS = 20000;

function applyLightDecay(pet: Pet): Pet {
  const now = new Date();
  const lastUpdated = new Date(pet.lastUpdated);
  const diffMs = now.getTime() - lastUpdated.getTime();
  const hoursPassed = Math.floor(diffMs / (1000 * 60 * 60));

  if (hoursPassed <= 0) return pet;

  return {
    ...pet,
    happiness: clamp(pet.happiness - hoursPassed * 2),
    energy: clamp(pet.energy - hoursPassed * 3),
    lastUpdated: now.toISOString(),
  };
}

function normalizeTaskLabel(label?: string) {
  const trimmed = label?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unlabeled";
}

function getCompletionRate(history: FocusSessionHistoryEntry[]) {
  if (history.length === 0) return 0;

  const completedCount = history.filter((session) => session.completed).length;
  return Math.round((completedCount / history.length) * 100);
}

function getTopLabel(history: FocusSessionHistoryEntry[]) {
  const minutesByLabel = new Map<string, number>();

  history.forEach((session) => {
    if (!session.completed) return;

    const label = normalizeTaskLabel(session.taskLabel);
    minutesByLabel.set(
      label,
      (minutesByLabel.get(label) ?? 0) + session.actualMinutes
    );
  });

  let topLabel: string | null = null;
  let topMinutes = 0;

  for (const [label, minutes] of minutesByLabel.entries()) {
    if (minutes > topMinutes) {
      topLabel = label;
      topMinutes = minutes;
    }
  }

  return topLabel;
}

function getLongestSessionMinutes(history: FocusSessionHistoryEntry[]) {
  return history.reduce((max, session) => {
    if (!session.completed) return max;
    return Math.max(max, session.actualMinutes);
  }, 0);
}

function getMinutesByLabel(history: FocusSessionHistoryEntry[]) {
  const labelMap = new Map<
    string,
    { label: string; minutes: number; sessions: number }
  >();

  history.forEach((session) => {
    if (!session.completed) return;

    const label = normalizeTaskLabel(session.taskLabel);
    const existing = labelMap.get(label);

    if (existing) {
      existing.minutes += session.actualMinutes;
      existing.sessions += 1;
      return;
    }

    labelMap.set(label, {
      label,
      minutes: session.actualMinutes,
      sessions: 1,
    });
  });

  return Array.from(labelMap.values()).sort((a, b) => b.minutes - a.minutes);
}

function formatSessionDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSessionTitle(session: FocusSessionHistoryEntry) {
  const trimmed = session.taskLabel?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unlabeled";
}

export default function HomePage() {
  const [pet, setPet] = useState<Pet>(DEFAULT_PET);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  const [focusMode, setFocusMode] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] =
    useState(FOCUS_DURATION_SECONDS);
  const [activeFocusSession, setActiveFocusSession] =
    useState<FocusSession | null>(null);
  const [focusSessionCount, setFocusSessionCount] = useState(0);

  const [showFocusCelebration, setShowFocusCelebration] = useState(false);
  const [showResetOptions, setShowResetOptions] = useState(false);

  const [focusTaskLabel, setFocusTaskLabel] = useState("");
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const [wasAutoPaused, setWasAutoPaused] = useState(false);
  const [lastNudgeBucket, setLastNudgeBucket] = useState(0);
  const [lastReturnAt, setLastReturnAt] = useState(0);

  const [todayOpen, setTodayOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const focusHistory = useMemo(
    () => browserCompanionStorage.loadFocusHistory(),
    [focusSessionCount]
  );

  const totalFocusedMinutes = useMemo(() => {
    return focusHistory.reduce((sum, session) => sum + session.actualMinutes, 0);
  }, [focusHistory]);

  const recentFocusSessions = useMemo(() => {
    return focusHistory.slice(0, 5);
  }, [focusHistory]);

  const todaySessions = useMemo(
    () => getTodaySessions(focusHistory),
    [focusHistory]
  );
  const todayMinutes = useMemo(
    () => getTodayMinutes(focusHistory),
    [focusHistory]
  );
  const streak = useMemo(() => getCurrentStreak(focusHistory), [focusHistory]);

  const completionRate = useMemo(
    () => getCompletionRate(focusHistory),
    [focusHistory]
  );

  const topLabel = useMemo(() => getTopLabel(focusHistory), [focusHistory]);

  const longestSessionMinutes = useMemo(
    () => getLongestSessionMinutes(focusHistory),
    [focusHistory]
  );

  const minutesByLabel = useMemo(
    () => getMinutesByLabel(focusHistory),
    [focusHistory]
  );

  const suggestedLabels = useMemo(() => {
    return Array.from(
      new Set(
        focusHistory
          .map((session) => session.taskLabel?.trim())
          .filter((label): label is string => Boolean(label))
      )
    ).slice(0, 4);
  }, [focusHistory]);

  const triggerFocusCelebration = () => {
    setShowFocusCelebration(true);

    window.setTimeout(() => {
      setShowFocusCelebration(false);
    }, 2200);
  };

  const triggerReaction = (nextReaction: string, duration = 900) => {
    setReaction(nextReaction);
    window.setTimeout(() => setReaction(null), duration);
  };

  const markActivity = () => {
    const now = Date.now();
    const inactiveFor = now - lastActivityAt;

    if (
      !focusMode &&
      inactiveFor > 1000 * 60 * 12 &&
      now - lastReturnAt > 1000 * 60 * 3
    ) {
      setPet((current) => ({
        ...current,
        currentDialogue: getWelcomeBackDialogue(),
        lastUpdated: new Date().toISOString(),
      }));

      setLastReturnAt(now);
    }

    setLastActivityAt(now);
  };

  const handlePauseFocusSession = (reason: "manual" | "auto" = "manual") => {
    setActiveFocusSession((current) => {
      if (!current || current.status === "paused") return current;

      const updatedSession = pauseFocusSession({
        session: current,
        focusSecondsLeft,
        storage: browserCompanionStorage,
      });

      return updatedSession;
    });

    triggerReaction("focus-pause", 950);

    if (reason === "auto") {
      setWasAutoPaused(true);
      setPet((current) => ({
        ...current,
        currentDialogue:
          "you went quiet for a bit, so i paused for you. we can hop back in whenever ✨",
        lastUpdated: new Date().toISOString(),
      }));
    } else {
      setWasAutoPaused(false);
      setPet((current) => ({
        ...current,
        currentDialogue: "okay, little pause. i’ll keep your spot warm 💜",
        lastUpdated: new Date().toISOString(),
      }));
    }
  };

  const handleResumeFocusSession = (reason: "manual" | "auto" = "manual") => {
    setActiveFocusSession((current) => {
      if (!current || current.status !== "paused") return current;

      const updatedSession = resumeFocusSession({
        session: current,
        storage: browserCompanionStorage,
      });

      return updatedSession;
    });

    triggerReaction("focus-resume", 900);
    setWasAutoPaused(false);
    setLastActivityAt(Date.now());

    setPet((current) => ({
      ...current,
      currentDialogue:
        reason === "auto"
          ? "welcome back. i resumed focus mode for you ✨"
          : "back in it. nice and steady, bestie 💫",
      lastUpdated: new Date().toISOString(),
    }));
  };

  useEffect(() => {
    const savedPet = browserCompanionStorage.loadPet();

    if (savedPet) {
      const updatedPet = applyLightDecay({
        ...savedPet,
        visits: (savedPet.visits ?? 0) + 1,
      });
      setPet(updatedPet);
      browserCompanionStorage.savePet(updatedPet);
    } else {
      browserCompanionStorage.savePet(DEFAULT_PET);
    }

    const history = browserCompanionStorage.loadFocusHistory();
    setFocusSessionCount(history.length);

    const restored = restoreSavedFocusSession({
      storage: browserCompanionStorage,
    });

    if (restored.type === "completed") {
      setFocusSessionCount(history.length + 1);

      setPet((current) => {
        const nextHappiness = clamp(current.happiness + 6);

        return {
          ...current,
          happiness: nextHappiness,
          currentDialogue: getFocusCompleteDialogue(restored.session.taskLabel),
          lastUpdated: new Date().toISOString(),
        };
      });

      triggerReaction("focus-complete", 1200);
      triggerFocusCelebration();
    }

    if (restored.type === "restored") {
      setActiveFocusSession(restored.session);
      setFocusMode(true);
      setFocusSecondsLeft(restored.remaining);
      setFocusTaskLabel(restored.session.taskLabel ?? "");
      setLastNudgeBucket(
        Math.floor(restored.session.elapsedSeconds / FOCUS_NUDGE_EVERY_SECONDS)
      );

      setPet((current) => ({
        ...current,
        currentDialogue:
          restored.session.status === "paused"
            ? "your focus session is paused. we can pick it back up whenever ✨"
            : "we're still in focus mode. you're doing amazing ✨",
      }));
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    browserCompanionStorage.savePet(pet);
  }, [pet, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setPet((current) => ({
        ...current,
        happiness: clamp(current.happiness - 1),
        energy: clamp(current.energy - 1),
        lastUpdated: new Date().toISOString(),
      }));
    }, 45000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || focusMode) return;

    const interval = setInterval(() => {
      setPet((current) => {
        const statsLine = getStatsAwareDialogue({
          topLabel,
          completionRate,
          todaySessions: todaySessions.length,
          streak,
          todayMinutes,
        });

        const nextDialogue =
          statsLine && Math.random() < 0.45
            ? statsLine
            : getContextualDialogue({
                mood: current.happiness,
                energy: current.energy,
              });

        return {
          ...current,
          currentDialogue: nextDialogue,
        };
      });
    }, AMBIENT_DIALOGUE_EVERY_MS);

    return () => clearInterval(interval);
  }, [
    isLoaded,
    focusMode,
    topLabel,
    completionRate,
    todaySessions.length,
    streak,
    todayMinutes,
  ]);

  useEffect(() => {
    const handleActivity = () => {
      markActivity();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("pointerdown", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
    };
  }, []);

  useEffect(() => {
    if (
      focusMode &&
      activeFocusSession &&
      activeFocusSession.status === "paused" &&
      wasAutoPaused
    ) {
      handleResumeFocusSession("auto");
    }
  }, [lastActivityAt, focusMode, activeFocusSession, wasAutoPaused]);

  useEffect(() => {
    if (
      !focusMode ||
      !activeFocusSession ||
      activeFocusSession.status !== "running"
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      const inactiveForSeconds = Math.floor((Date.now() - lastActivityAt) / 1000);

      if (inactiveForSeconds >= AUTO_PAUSE_AFTER_SECONDS) {
        handlePauseFocusSession("auto");
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [focusMode, activeFocusSession, lastActivityAt]);

  useEffect(() => {
    if (
      !focusMode ||
      !activeFocusSession ||
      activeFocusSession.status !== "running"
    ) {
      return;
    }

    const tick = () => {
      const result = tickFocusSession({
        session: activeFocusSession,
        storage: browserCompanionStorage,
      });

      if (result.type === "completed") {
        setFocusMode(false);
        setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
        setActiveFocusSession(null);
        setFocusSessionCount((count) => count + 1);
        setWasAutoPaused(false);
        setLastNudgeBucket(0);

        setPet((current) => {
          const nextHappiness = clamp(current.happiness + 6);

          return {
            ...current,
            happiness: nextHappiness,
            currentDialogue: getFocusCompleteDialogue(result.session.taskLabel),
            lastUpdated: new Date().toISOString(),
          };
        });

        triggerReaction("focus-complete", 1200);
        triggerFocusCelebration();
        return;
      }

      setFocusSecondsLeft(result.remaining);

      const currentNudgeBucket = Math.floor(
        result.elapsed / FOCUS_NUDGE_EVERY_SECONDS
      );

      if (currentNudgeBucket > 0 && currentNudgeBucket > lastNudgeBucket) {
        setLastNudgeBucket(currentNudgeBucket);
        setPet((current) => ({
          ...current,
          currentDialogue: getFocusNudge(
            result.elapsed,
            activeFocusSession.taskLabel
          ),
          lastUpdated: new Date().toISOString(),
        }));
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [focusMode, activeFocusSession, lastNudgeBucket]);

  const handleAction = (action: InteractionType) => {
    if (focusMode) return;

    markActivity();

    setReaction(action);
    window.setTimeout(() => setReaction(null), 700);

    setPet((current) => {
      let happinessBoost = 0;
      let energyBoost = 0;

      switch (action) {
        case "pet":
          happinessBoost = 8;
          energyBoost = -2;
          break;
        case "feed":
          happinessBoost = 4;
          energyBoost = 10;
          break;
        case "play":
          happinessBoost = 12;
          energyBoost = -8;
          break;
      }

      const nextHappiness = clamp(current.happiness + happinessBoost);
      const nextEnergy = clamp(current.energy + energyBoost);

      return {
        ...current,
        happiness: nextHappiness,
        energy: nextEnergy,
        lastInteraction: action,
        currentDialogue: getContextualDialogue({
          mood: nextHappiness,
          energy: nextEnergy,
          action,
        }),
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const handleResetToday = () => {
    browserCompanionStorage.resetTodayFocusData();

    setFocusMode(false);
    setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
    setActiveFocusSession(null);
    setWasAutoPaused(false);
    setLastNudgeBucket(0);

    const updatedHistory = browserCompanionStorage.loadFocusHistory();
    setFocusSessionCount(updatedHistory.length);

    setPet((current) => ({
      ...current,
      currentDialogue: "today’s focus data has been gently cleared ✨",
      lastUpdated: new Date().toISOString(),
    }));

    setShowResetOptions(false);
  };

  const handleResetAll = () => {
    browserCompanionStorage.resetAllAppData();

    const freshPet: Pet = {
      ...DEFAULT_PET,
      visits: 1,
      lastUpdated: new Date().toISOString(),
      currentDialogue: "fresh start activated. hi bestie ✨",
    };

    setPet(freshPet);
    browserCompanionStorage.savePet(freshPet);

    setFocusMode(false);
    setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
    setActiveFocusSession(null);
    setFocusSessionCount(0);
    setReaction(null);
    setShowResetOptions(false);
    setShowFocusCelebration(false);
    setFocusTaskLabel("");
    setWasAutoPaused(false);
    setLastNudgeBucket(0);
  };

  const toggleFocusMode = () => {
    markActivity();

    if (focusMode && activeFocusSession) {
      const cancelledSession = cancelFocusSession({
        session: activeFocusSession,
        focusSecondsLeft,
        storage: browserCompanionStorage,
      });

      setFocusMode(false);
      setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
      setActiveFocusSession(null);
      setFocusSessionCount((count) => count + 1);
      setWasAutoPaused(false);
      setLastNudgeBucket(0);

      setPet((current) => ({
        ...current,
        currentDialogue: getCancelledFocusDialogue(cancelledSession.taskLabel),
        lastUpdated: new Date().toISOString(),
      }));

      return;
    }

    const session = startFocusSession({
      plannedMinutes: FOCUS_DURATION_MINUTES,
      taskLabel: focusTaskLabel,
      storage: browserCompanionStorage,
    });

    setActiveFocusSession(session);
    setFocusMode(true);
    setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
    setWasAutoPaused(false);
    setLastNudgeBucket(0);
    setLastActivityAt(Date.now());

    triggerReaction("focus-start", 1000);

    setPet((current) => ({
      ...current,
      currentDialogue: session.taskLabel
        ? `focus mode activated for ${session.taskLabel}. i’m locked in with you ✨`
        : "focus mode activated. one tiny step at a time ✨",
      lastUpdated: new Date().toISOString(),
    }));
  };

  const vibeText = useMemo(() => {
    if (focusMode) return "focused";
    if (pet.happiness >= 75 && pet.energy >= 60) return "thriving";
    if (pet.happiness >= 45 && pet.energy >= 35) return "cozy";
    return "sleepy";
  }, [pet.happiness, pet.energy, focusMode]);

  const historySubtitle =
    recentFocusSessions.length > 0
      ? `${recentFocusSessions.length} recent session${
          recentFocusSessions.length === 1 ? "" : "s"
        }`
      : "No sessions yet";

  const statsSubtitle = topLabel
    ? `Top label: ${topLabel}`
    : "No strong pattern yet";

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1020] text-white">
        <p className="text-sm text-white/70">summoning your ghost...</p>
      </main>
    );
  }

  return (
    <main
      onPointerDown={markActivity}
      className={`min-h-screen px-3 py-4 text-white transition-colors duration-500 ${
        focusMode
          ? "bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_35%),linear-gradient(180deg,_#0d1020_0%,_#15192a_100%)]"
          : "bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18),_transparent_35%),linear-gradient(180deg,_#0f1020_0%,_#17182d_100%)]"
      }`}
    >
      <AnimatePresence>
        {showFocusCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed left-1/2 top-4 z-50 w-[min(92vw,320px)] -translate-x-1/2"
          >
            <div className="rounded-2xl border border-violet-300/20 bg-[#1a1730]/90 px-4 py-3 text-center shadow-2xl backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.2em] text-violet-200/60">
                Focus Complete
              </p>
              <p className="mt-1 text-sm text-white">✨ wisp is proud of you ✨</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[360px]">
        <section
          className={`rounded-[28px] border px-4 py-4 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
            focusMode
              ? "border-violet-200/10 bg-white/[0.035]"
              : "border-white/10 bg-white/[0.045]"
          }`}
        >
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.26em] text-white/45">
              Pocket Ghost
            </p>

            <input
              value={pet.name}
              onChange={(e) =>
                setPet((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-2 w-full bg-transparent text-center text-2xl font-semibold outline-none"
            />

            <p className="mt-1 text-xs text-white/55">
              your tiny spectral coding companion
            </p>

            <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-white/45">
              <span>mood: {vibeText}</span>
              <span>•</span>
              <span>visits: {pet.visits}</span>
            </div>
          </div>

          <div
            className={`mt-3 transition-opacity duration-300 ${
              focusMode && activeFocusSession?.status === "paused"
                ? "opacity-70"
                : "opacity-100"
            }`}
          >
            <div className="origin-top scale-[0.78]">
              <GhostPet
                mood={pet.happiness}
                energy={pet.energy}
                reaction={reaction}
                focusMode={focusMode}
                focusPaused={activeFocusSession?.status === "paused"}
              />
            </div>
          </div>

          <div className="-mt-10">
            <DialogueBubble message={pet.currentDialogue} />
          </div>

          <div className="mt-4 space-y-3">
            <MiniStatusBar label="Happiness" value={pet.happiness} />
            <MiniStatusBar label="Energy" value={pet.energy} />
          </div>

          <div
            className={`mt-4 transition-opacity duration-300 ${
              focusMode ? "opacity-60" : "opacity-100"
            }`}
          >
            <ActionPanel onAction={handleAction} />
          </div>

          <div className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-violet-200/60">
                  {activeFocusSession?.status === "paused"
                    ? "Focus Paused"
                    : focusMode
                    ? "Focus Mode"
                    : "Ready to Focus"}
                </p>

                {focusMode && activeFocusSession?.taskLabel ? (
                  <p className="mt-1 text-xs text-violet-100/75">
                    {activeFocusSession.taskLabel}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/50">
                    one task at a time, bestie
                  </p>
                )}
              </div>

              <p className="text-2xl font-semibold text-white">
                {formatTime(focusSecondsLeft)}
              </p>
            </div>

            {!focusMode && (
              <div className="mt-3">
                <input
                  value={focusTaskLabel}
                  onChange={(e) => setFocusTaskLabel(e.target.value)}
                  maxLength={60}
                  placeholder="focus label"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-300/25"
                />

                {suggestedLabels.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestedLabels.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFocusTaskLabel(label)}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 transition hover:bg-white/10 hover:text-white"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={toggleFocusMode}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  focusMode
                    ? "border-violet-300/30 bg-violet-300/20 text-white hover:bg-violet-300/25"
                    : "border-white/10 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {focusMode ? "End" : "Start"}
              </button>

              {focusMode && activeFocusSession ? (
                <button
                  onClick={() =>
                    activeFocusSession.status === "paused"
                      ? handleResumeFocusSession("manual")
                      : handlePauseFocusSession("manual")
                  }
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white transition hover:bg-white/20"
                >
                  {activeFocusSession.status === "paused" ? "Resume" : "Pause"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <CompactStatChip label="Today" value={`${todayMinutes}m`} />
            <CompactStatChip label="Sessions" value={todaySessions.length} />
            <CompactStatChip label="Streak" value={streak} />
          </div>

          <div className="mt-4 space-y-3">
            <SidebarSection
              title="Today"
              subtitle={`${todayMinutes} minutes across ${todaySessions.length} session${
                todaySessions.length === 1 ? "" : "s"
              }`}
              isOpen={todayOpen}
              onToggle={() => setTodayOpen((current) => !current)}
            >
              <div className="grid grid-cols-2 gap-2">
                <CompactStatChip label="Today Minutes" value={todayMinutes} />
                <CompactStatChip
                  label="Today Sessions"
                  value={todaySessions.length}
                />
                <CompactStatChip label="Streak" value={streak} />
                <CompactStatChip
                  label="Saved Sessions"
                  value={focusSessionCount}
                />
              </div>
            </SidebarSection>

            <SidebarSection
              title="History"
              subtitle={historySubtitle}
              isOpen={historyOpen}
              onToggle={() => setHistoryOpen((current) => !current)}
            >
              {recentFocusSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-white/55">
                  no focus sessions yet. your ghost believes in your productivity arc ✨
                </div>
              ) : (
                <div className="space-y-2">
                  {recentFocusSessions.map((session) => {
                    const completed = session.status === "completed";

                    return (
                      <div
                        key={session.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {getSessionTitle(session)}
                            </p>
                            <p className="mt-1 text-[11px] text-white/45">
                              {formatSessionDate(session.endTime)}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
                              completed
                                ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                                : "border border-rose-300/20 bg-rose-300/10 text-rose-100"
                            }`}
                          >
                            {completed ? "Done" : "Stopped"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-white/65">
                          <span>{session.actualMinutes} min</span>
                          <span>planned {session.plannedMinutes}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SidebarSection>

            <SidebarSection
              title="Stats"
              subtitle={statsSubtitle}
              isOpen={statsOpen}
              onToggle={() => setStatsOpen((current) => !current)}
            >
              <div className="grid grid-cols-2 gap-2">
                <CompactStatChip
                  label="Completion"
                  value={`${completionRate}%`}
                />
                <CompactStatChip
                  label="Longest"
                  value={`${longestSessionMinutes}m`}
                />
                <CompactStatChip
                  label="Task Types"
                  value={minutesByLabel.length}
                />
                <CompactStatChip
                  label="Focused Total"
                  value={`${totalFocusedMinutes}m`}
                />
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Top Label
                </p>
                <p className="mt-1 text-sm text-white">{topLabel ?? "None yet"}</p>
              </div>

              {minutesByLabel.length > 0 && (
                <div className="mt-3 space-y-2">
                  {minutesByLabel.slice(0, 4).map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="truncate text-white/80">{item.label}</span>
                      <span className="shrink-0 text-white/55">
                        {item.minutes}m · {item.sessions}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SidebarSection>

            <SidebarSection
              title="Settings"
              subtitle="reset and cleanup options"
              isOpen={settingsOpen}
              onToggle={() => setSettingsOpen((current) => !current)}
            >
              <button
                onClick={() => setShowResetOptions((current) => !current)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10"
              >
                {showResetOptions ? "Hide Reset Options" : "Show Reset Options"}
              </button>

              <AnimatePresence>
                {showResetOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="mt-3 grid gap-2"
                  >
                    <button
                      onClick={handleResetToday}
                      className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2.5 text-sm text-amber-100 transition hover:bg-amber-300/15"
                    >
                      Reset Today’s Focus Data
                    </button>

                    <button
                      onClick={handleResetAll}
                      className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2.5 text-sm text-rose-100 transition hover:bg-rose-300/15"
                    >
                      Reset All Data
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </SidebarSection>
          </div>
        </section>
      </div>
    </main>
  );
}