import { CompanionStorage } from "./companion-storage";
import { FocusSession, FocusSessionHistoryEntry } from "./types";

export const AUTO_PAUSE_AFTER_SECONDS = 5 * 60;
export const FOCUS_NUDGE_EVERY_SECONDS = 10 * 60;

export function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getElapsedSeconds(session: FocusSession) {
  const start = new Date(session.startTime).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 1000));
}

export function getRemainingSeconds(session: FocusSession) {
  const elapsed = getElapsedSeconds(session);
  const pausedSeconds = session.totalPausedSeconds ?? 0;
  const effectiveElapsed = Math.max(0, elapsed - pausedSeconds);
  return Math.max(0, session.plannedMinutes * 60 - effectiveElapsed);
}

export function buildHistoryEntry(
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

export function getFocusNudge(elapsedSeconds: number, taskLabel?: string) {
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

export function createFocusSession(
  plannedMinutes: number,
  taskLabel?: string
): FocusSession {
  const trimmedLabel = taskLabel?.trim();

  return {
    id: crypto.randomUUID(),
    taskLabel: trimmedLabel || undefined,
    plannedMinutes,
    startTime: new Date().toISOString(),
    elapsedSeconds: 0,
    status: "running",
    totalPausedSeconds: 0,
  };
}

export function startFocusSession(params: {
  plannedMinutes: number;
  taskLabel?: string;
  storage: CompanionStorage;
}) {
  const session = createFocusSession(params.plannedMinutes, params.taskLabel);
  params.storage.saveActiveFocusSession(session);
  return session;
}

export function pauseFocusSession(params: {
  session: FocusSession;
  focusSecondsLeft: number;
  storage: CompanionStorage;
}) {
  const { session, focusSecondsLeft, storage } = params;

  if (session.status === "paused") {
    return session;
  }

  const updatedSession: FocusSession = {
    ...session,
    elapsedSeconds: session.plannedMinutes * 60 - focusSecondsLeft,
    status: "paused",
    pausedAt: new Date().toISOString(),
  };

  storage.saveActiveFocusSession(updatedSession);
  return updatedSession;
}

export function resumeFocusSession(params: {
  session: FocusSession;
  storage: CompanionStorage;
}) {
  const { session, storage } = params;

  if (session.status !== "paused") {
    return session;
  }

  const pausedAt = session.pausedAt ? new Date(session.pausedAt) : new Date();

  const pausedDurationSeconds = Math.max(
    0,
    Math.floor((Date.now() - pausedAt.getTime()) / 1000)
  );

  const updatedSession: FocusSession = {
    ...session,
    status: "running",
    pausedAt: undefined,
    totalPausedSeconds:
      (session.totalPausedSeconds ?? 0) + pausedDurationSeconds,
  };

  storage.saveActiveFocusSession(updatedSession);
  return updatedSession;
}

export function cancelFocusSession(params: {
  session: FocusSession;
  focusSecondsLeft: number;
  storage: CompanionStorage;
}) {
  const { session, focusSecondsLeft, storage } = params;

  const cancelledSession: FocusSession = {
    ...session,
    elapsedSeconds: session.plannedMinutes * 60 - focusSecondsLeft,
    status: "cancelled",
    endTime: new Date().toISOString(),
  };

  storage.addFocusHistoryEntry(buildHistoryEntry(cancelledSession, false));
  storage.clearActiveFocusSession();

  return cancelledSession;
}

export function completeFocusSession(params: {
  session: FocusSession;
  storage: CompanionStorage;
}) {
  const { session, storage } = params;

  const completedSession: FocusSession = {
    ...session,
    elapsedSeconds: session.plannedMinutes * 60,
    status: "completed",
    endTime: new Date().toISOString(),
  };

  storage.addFocusHistoryEntry(buildHistoryEntry(completedSession, true));
  storage.clearActiveFocusSession();

  return completedSession;
}

export function restoreSavedFocusSession(params: {
  storage: CompanionStorage;
}) {
  const savedSession = params.storage.loadActiveFocusSession();

  if (!savedSession) {
    return {
      type: "none" as const,
    };
  }

  const remaining = getRemainingSeconds(savedSession);

  if (remaining <= 0) {
    const completedSession = completeFocusSession({
      session: {
        ...savedSession,
        elapsedSeconds: savedSession.plannedMinutes * 60,
        status: "completed",
        endTime: new Date().toISOString(),
      },
      storage: params.storage,
    });

    return {
      type: "completed" as const,
      session: completedSession,
    };
  }

  const restoredSession: FocusSession = {
    ...savedSession,
    elapsedSeconds: savedSession.plannedMinutes * 60 - remaining,
  };

  return {
    type: "restored" as const,
    session: restoredSession,
    remaining,
  };
}

export function tickFocusSession(params: {
  session: FocusSession;
  storage: CompanionStorage;
}) {
  const { session, storage } = params;
  const remaining = getRemainingSeconds(session);
  const elapsed = session.plannedMinutes * 60 - remaining;

  if (remaining <= 0) {
    const completedSession = completeFocusSession({
      session: {
        ...session,
        elapsedSeconds: session.plannedMinutes * 60,
        status: "completed",
        endTime: new Date().toISOString(),
      },
      storage,
    });

    return {
      type: "completed" as const,
      session: completedSession,
      remaining: 0,
      elapsed: session.plannedMinutes * 60,
    };
  }

  return {
    type: "running" as const,
    remaining,
    elapsed,
  };
}