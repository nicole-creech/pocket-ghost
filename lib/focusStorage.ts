import { FocusSession, FocusSessionHistoryEntry } from "./types";

const ACTIVE_SESSION_KEY = "wisp.activeFocusSession";
const SESSION_HISTORY_KEY = "wisp.focusSessionHistory";
const MAX_HISTORY_ENTRIES = 100;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getActiveFocusSession(): FocusSession | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as FocusSession;
  } catch (error) {
    console.error("Failed to read active focus session from storage", error);
    return null;
  }
}

export function saveActiveFocusSession(session: FocusSession): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Failed to save active focus session", error);
  }
}

export function clearActiveFocusSession(): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear active focus session", error);
  }
}

export function getFocusSessionHistory(): FocusSessionHistoryEntry[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(SESSION_HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as FocusSessionHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read focus session history", error);
    return [];
  }
}

export function saveFocusSessionHistory(
  history: FocusSessionHistoryEntry[],
): void {
  if (!isBrowser()) return;

  try {
    const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);
    window.localStorage.setItem(
      SESSION_HISTORY_KEY,
      JSON.stringify(trimmedHistory),
    );
  } catch (error) {
    console.error("Failed to save focus session history", error);
  }
}

export function addFocusSessionHistoryEntry(
  entry: FocusSessionHistoryEntry,
): void {
  const existingHistory = getFocusSessionHistory();
  const updatedHistory = [entry, ...existingHistory].slice(
    0,
    MAX_HISTORY_ENTRIES,
  );

  saveFocusSessionHistory(updatedHistory);
}