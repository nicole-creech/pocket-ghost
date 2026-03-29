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
} from "./storage";
import { FocusSession, FocusSessionHistoryEntry, Pet } from "./types";

export interface CompanionStorage {
  loadPet(): Pet | null;
  savePet(pet: Pet): void;

  loadActiveFocusSession(): FocusSession | null;
  saveActiveFocusSession(session: FocusSession): void;
  clearActiveFocusSession(): void;

  loadFocusHistory(): FocusSessionHistoryEntry[];
  addFocusHistoryEntry(entry: FocusSessionHistoryEntry): void;

  resetTodayFocusData(): void;
  resetAllAppData(): void;
}

export const browserCompanionStorage: CompanionStorage = {
  loadPet,
  savePet,

  loadActiveFocusSession: getActiveFocusSession,
  saveActiveFocusSession,

  clearActiveFocusSession,

  loadFocusHistory: getFocusSessionHistory,
  addFocusHistoryEntry: addFocusSessionHistoryEntry,

  resetTodayFocusData,
  resetAllAppData,
};