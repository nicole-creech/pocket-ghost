"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ActionPanel from "@/components/ActionPanel";
import DialogueBubble from "@/components/DialogueBubble";
import GhostPet from "@/components/GhostPet";
import StatusBar from "@/components/StatusBar";
import FocusHistoryCard from "@/components/FocusHistoryCard";
import FocusTodayCard from "@/components/FocusTodayCard";
import {
  DEFAULT_PET,
  getContextualDialogue,
  getFocusAwareDialogue,
} from "@/lib/pet-data";
import {
  addFocusSessionHistoryEntry,
  clearActiveFocusSession,
  getActiveFocusSession,
  getFocusSessionHistory,
  loadPet,
  resetAllAppData,
  resetTodayFocusData,
  saveActiveFocusSession,
  savePet,
} from "@/lib/storage";
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
const FOCUS_NUDGE_EVERY_SECONDS = 10 * 60;
const AMBIENT_DIALOGUE_EVERY_MS = 20000;

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

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

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getElapsedSeconds(session: FocusSession) {
  const start = new Date(session.startTime).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 1000));
}

function getRemainingSeconds(session: FocusSession) {
  const elapsed = getElapsedSeconds(session);
  const pausedSeconds = session.totalPausedSeconds ?? 0;
  const effectiveElapsed = Math.max(0, elapsed - pausedSeconds);
  return Math.max(0, session.plannedMinutes * 60 - effectiveElapsed);
}

function buildHistoryEntry(
  session: FocusSession,
  completed: boolean
): FocusSessionHistoryEntry {
  const actualSeconds = Math.min(
    session.elapsedSeconds,
    session.plannedMinutes * 60
  );

  return {
    id: session.id,
    taskLabel: session.taskLabel,
    plannedMinutes: session.plannedMinutes,
    actualMinutes: Math.max(1, Math.round(actualSeconds / 60)),
    startTime: session.startTime,
    endTime: new Date().toISOString(),
    status: completed ? "completed" : "cancelled",
    completed,
  };
}

function getFocusNudge(elapsedSeconds: number, taskLabel?: string) {
  const taskText = taskLabel?.trim() ? ` on ${taskLabel.trim()}` : "";

  if (elapsedSeconds >= 60 * 60) {
    return `you have been locked in${taskText} for a while. hydration check 💧`;
  }

  if (elapsedSeconds >= 45 * 60) {
    return `steady progress${taskText}. you are doing really well ✨`;
  }

  if (elapsedSeconds >= 30 * 60) {
    return `look at you staying with it${taskText}. i’m proud of you 👻`;
  }

  return `small progress still counts${taskText}. keep going 💜`;
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

function getStatsAwareDialogue({
  topLabel,
  completionRate,
  todaySessions,
}: {
  topLabel: string | null;
  completionRate: number;
  todaySessions: number;
}) {
  if (todaySessions >= 4) {
    return "you’ve been really steady today. i’m very proud of you 💜";
  }

  if (completionRate >= 80) {
    return "you’ve been finishing what you start lately. that’s huge ✨";
  }

  if (topLabel && topLabel !== "Unlabeled") {
    return `you and i have been spending a lot of time on ${topLabel} lately 👻`;
  }

  return null;
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

  const focusHistory = useMemo(
    () => getFocusSessionHistory(),
    [focusSessionCount]
  );

  const totalFocusedMinutes = useMemo(() => {
    return focusHistory.reduce((sum, session) => sum + session.actualMinutes, 0);
  }, [focusHistory]);

  const recentFocusSessions = useMemo(() => {
    return focusHistory.slice(0, 3);
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
    ).slice(0, 5);
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
    setLastActivityAt(Date.now());
  };

  const pauseFocusSession = (reason: "manual" | "auto" = "manual") => {
    setActiveFocusSession((current) => {
      if (!current || current.status === "paused") return current;

      const updatedSession: FocusSession = {
        ...current,
        elapsedSeconds: current.plannedMinutes * 60 - focusSecondsLeft,
        status: "paused",
        pausedAt: new Date().toISOString(),
      };

      saveActiveFocusSession(updatedSession);
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

  const resumeFocusSession = (reason: "manual" | "auto" = "manual") => {
    setActiveFocusSession((current) => {
      if (!current || current.status !== "paused") return current;

      const pausedAt = current.pausedAt
        ? new Date(current.pausedAt)
        : new Date();

      const pausedDurationSeconds = Math.max(
        0,
        Math.floor((Date.now() - pausedAt.getTime()) / 1000)
      );

      const updatedSession: FocusSession = {
        ...current,
        status: "running",
        pausedAt: undefined,
        totalPausedSeconds:
          (current.totalPausedSeconds ?? 0) + pausedDurationSeconds,
      };

      saveActiveFocusSession(updatedSession);
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
    const savedPet = loadPet();

    if (savedPet) {
      const updatedPet = applyLightDecay({
        ...savedPet,
        visits: (savedPet.visits ?? 0) + 1,
      });
      setPet(updatedPet);
      savePet(updatedPet);
    } else {
      savePet(DEFAULT_PET);
    }

    const history = getFocusSessionHistory();
    setFocusSessionCount(history.length);

    const savedSession = getActiveFocusSession();

    if (savedSession) {
      const remaining = getRemainingSeconds(savedSession);

      if (remaining <= 0) {
        const completedSession: FocusSession = {
          ...savedSession,
          elapsedSeconds: savedSession.plannedMinutes * 60,
          status: "completed",
          endTime: new Date().toISOString(),
        };

        addFocusSessionHistoryEntry(buildHistoryEntry(completedSession, true));
        clearActiveFocusSession();
        setFocusSessionCount(history.length + 1);

        setPet((current) => {
          const nextHappiness = clamp(current.happiness + 6);

          return {
            ...current,
            happiness: nextHappiness,
            currentDialogue: savedSession.taskLabel
              ? `you did it — ${savedSession.taskLabel} is done for now. i’m so proud of you 💖`
              : "focus session complete. look at you go, little legend ✨",
            lastUpdated: new Date().toISOString(),
          };
        });

        triggerReaction("focus-complete", 1200);
        triggerFocusCelebration();
      } else {
        const restoredSession: FocusSession = {
          ...savedSession,
          elapsedSeconds: savedSession.plannedMinutes * 60 - remaining,
        };

        setActiveFocusSession(restoredSession);
        setFocusMode(true);
        setFocusSecondsLeft(remaining);
        setFocusTaskLabel(restoredSession.taskLabel ?? "");
        setLastNudgeBucket(
          Math.floor(restoredSession.elapsedSeconds / FOCUS_NUDGE_EVERY_SECONDS)
        );

        setPet((current) => ({
          ...current,
          currentDialogue:
            restoredSession.status === "paused"
              ? "your focus session is paused. we can pick it back up whenever ✨"
              : "we're still in focus mode. you're doing amazing ✨",
        }));
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    savePet(pet);
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
  }, [isLoaded, focusMode, topLabel, completionRate, todaySessions.length]);

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
      resumeFocusSession("auto");
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
        pauseFocusSession("auto");
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
      const remaining = getRemainingSeconds(activeFocusSession);
      const elapsed = activeFocusSession.plannedMinutes * 60 - remaining;

      if (remaining <= 0) {
        const completedSession: FocusSession = {
          ...activeFocusSession,
          elapsedSeconds: activeFocusSession.plannedMinutes * 60,
          status: "completed",
          endTime: new Date().toISOString(),
        };

        addFocusSessionHistoryEntry(buildHistoryEntry(completedSession, true));
        clearActiveFocusSession();

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
            currentDialogue: activeFocusSession.taskLabel
              ? `you did it — ${activeFocusSession.taskLabel} is done for now. i’m so proud of you 💖`
              : "focus session complete. look at you go, little legend ✨",
            lastUpdated: new Date().toISOString(),
          };
        });

        triggerReaction("focus-complete", 1200);
        triggerFocusCelebration();
        return;
      }

      setFocusSecondsLeft(remaining);

      const currentNudgeBucket = Math.floor(elapsed / FOCUS_NUDGE_EVERY_SECONDS);

      if (currentNudgeBucket > 0 && currentNudgeBucket > lastNudgeBucket) {
        setLastNudgeBucket(currentNudgeBucket);
        setPet((current) => ({
          ...current,
          currentDialogue: getFocusNudge(elapsed, activeFocusSession.taskLabel),
          lastUpdated: new Date().toISOString(),
        }));
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [
    focusMode,
    activeFocusSession,
    lastNudgeBucket,
  ]);

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
    resetTodayFocusData();

    setFocusMode(false);
    setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
    setActiveFocusSession(null);
    setWasAutoPaused(false);
    setLastNudgeBucket(0);

    const updatedHistory = getFocusSessionHistory();
    setFocusSessionCount(updatedHistory.length);

    setPet((current) => ({
      ...current,
      currentDialogue: "today’s focus data has been gently cleared ✨",
      lastUpdated: new Date().toISOString(),
    }));

    setShowResetOptions(false);
  };

  const handleResetAll = () => {
    resetAllAppData();

    const freshPet: Pet = {
      ...DEFAULT_PET,
      visits: 1,
      lastUpdated: new Date().toISOString(),
      currentDialogue: "fresh start activated. hi bestie ✨",
    };

    setPet(freshPet);
    savePet(freshPet);

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
      const cancelledSession: FocusSession = {
        ...activeFocusSession,
        elapsedSeconds:
          activeFocusSession.plannedMinutes * 60 - focusSecondsLeft,
        status: "cancelled",
        endTime: new Date().toISOString(),
      };

      addFocusSessionHistoryEntry(buildHistoryEntry(cancelledSession, false));
      clearActiveFocusSession();

      setFocusMode(false);
      setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
      setActiveFocusSession(null);
      setFocusSessionCount((count) => count + 1);
      setWasAutoPaused(false);
      setLastNudgeBucket(0);

      setPet((current) => ({
        ...current,
        currentDialogue: getContextualDialogue({
          mood: current.happiness,
          energy: current.energy,
        }),
        lastUpdated: new Date().toISOString(),
      }));

      return;
    }

    const trimmedLabel = focusTaskLabel.trim();

    const session: FocusSession = {
      id: crypto.randomUUID(),
      taskLabel: trimmedLabel || undefined,
      plannedMinutes: FOCUS_DURATION_MINUTES,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
      status: "running",
      totalPausedSeconds: 0,
    };

    saveActiveFocusSession(session);
    setActiveFocusSession(session);
    setFocusMode(true);
    setFocusSecondsLeft(FOCUS_DURATION_SECONDS);
    setWasAutoPaused(false);
    setLastNudgeBucket(0);
    setLastActivityAt(Date.now());

    triggerReaction("focus-start", 1000);

    setPet((current) => ({
      ...current,
      currentDialogue: trimmedLabel
        ? `focus mode activated for ${trimmedLabel}. i’m locked in with you ✨`
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
      className={`min-h-screen px-6 py-10 text-white transition-colors duration-500 ${
        focusMode
          ? "bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_35%),linear-gradient(180deg,_#0d1020_0%,_#15192a_100%)]"
          : "bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.22),_transparent_35%),linear-gradient(180deg,_#0f1020_0%,_#17182d_100%)]"
      }`}
    >
      <AnimatePresence>
        {showFocusCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none fixed left-1/2 top-6 z-50 w-[min(92vw,420px)] -translate-x-1/2"
          >
            <div className="rounded-2xl border border-violet-300/20 bg-[#1a1730]/90 px-4 py-3 text-center shadow-2xl backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-200/60">
                Focus Complete
              </p>
              <p className="mt-1 text-sm text-white">
                ✨ wisp is proud of you ✨
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section
          className={`w-full rounded-[32px] border p-10 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
            focusMode
              ? "border-violet-200/10 bg-white/4"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Pocket Ghost
            </p>
            <input
              value={pet.name}
              onChange={(e) =>
                setPet((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-2 w-full bg-transparent text-center text-3xl font-semibold outline-none"
            />
            <p className="mt-2 text-sm text-white/60">
              your tiny spectral coding companion
            </p>
          </div>

          <div
            className={`my-4 transition-opacity duration-300 ${
              focusMode && activeFocusSession?.status === "paused"
                ? "opacity-70"
                : "opacity-100"
            }`}
          >
            <GhostPet
              mood={pet.happiness}
              energy={pet.energy}
              reaction={reaction}
              focusMode={focusMode}
              focusPaused={activeFocusSession?.status === "paused"}
            />
          </div>

          {focusMode && (
            <div className="mb-4 rounded-2xl border border-violet-300/20 bg-violet-300/10 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-violet-200/70">
                {activeFocusSession?.status === "paused"
                  ? "Focus Mode Paused"
                  : "Focus Mode"}
              </p>

              {activeFocusSession?.taskLabel && (
                <p className="mt-1 text-xs text-violet-100/70">
                  working on: {activeFocusSession.taskLabel}
                </p>
              )}

              <p className="mt-1 text-2xl font-semibold text-white">
                {formatTime(focusSecondsLeft)}
              </p>

              {activeFocusSession && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      activeFocusSession.status === "paused"
                        ? resumeFocusSession("manual")
                        : pauseFocusSession("manual")
                    }
                    className="flex-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white transition hover:bg-white/20"
                  >
                    {activeFocusSession.status === "paused" ? "Resume" : "Pause"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <DialogueBubble message={pet.currentDialogue} />
          </div>

          <div className="mt-6 space-y-4">
            <StatusBar label="Happiness" value={pet.happiness} />
            <StatusBar label="Energy" value={pet.energy} />
          </div>

          <div
            className={`mt-6 transition-opacity duration-300 ${
              focusMode ? "opacity-60" : "opacity-100"
            }`}
          >
            <ActionPanel onAction={handleAction} />
          </div>

          <div className="mt-4">
            {!focusMode && (
              <div className="mb-3">
                <input
                  value={focusTaskLabel}
                  onChange={(e) => setFocusTaskLabel(e.target.value)}
                  maxLength={60}
                  placeholder="optional focus label, like portfolio or bug fixes"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-violet-300/25 focus:bg-white/8"
                />

                {suggestedLabels.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedLabels.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFocusTaskLabel(label)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleFocusMode}
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                focusMode
                  ? "border-violet-300/30 bg-violet-300/20 text-white hover:bg-violet-300/25"
                  : "border-white/10 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {focusMode ? "End Focus Mode" : "Start Focus Mode"}
            </button>

            <FocusTodayCard
              todayMinutes={todayMinutes}
              todaySessions={todaySessions.length}
              streak={streak}
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                  Top Label
                </p>
                <p className="mt-1 text-sm text-white">
                  {topLabel ?? "None yet"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                  Completion Rate
                </p>
                <p className="mt-1 text-sm text-white">
                  {completionRate}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                  Longest Session
                </p>
                <p className="mt-1 text-sm text-white">
                  {longestSessionMinutes} min
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                  Task Types
                </p>
                <p className="mt-1 text-sm text-white">
                  {minutesByLabel.length}
                </p>
              </div>
            </div>

            <FocusHistoryCard
              totalSessions={focusSessionCount}
              totalMinutes={totalFocusedMinutes}
              recentSessions={recentFocusSessions}
              topLabel={topLabel}
              completionRate={completionRate}
            />

            <div className="mt-4">
              <button
                onClick={() => setShowResetOptions((current) => !current)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
              >
                {showResetOptions ? "Hide Reset Options" : "Reset Options"}
              </button>

              <AnimatePresence>
                {showResetOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-3 grid gap-3"
                  >
                    <button
                      onClick={handleResetToday}
                      className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-300/15"
                    >
                      Reset Today’s Focus Data
                    </button>

                    <button
                      onClick={handleResetAll}
                      className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-300/15"
                    >
                      Reset All Data
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-white/50">
            <span>mood: {vibeText}</span>
            <span>visits: {pet.visits}</span>
          </div>

          <div className="mt-2 text-center text-xs text-white/35">
            focus sessions saved: {focusSessionCount}
          </div>
        </section>
      </div>
    </main>
  );
}