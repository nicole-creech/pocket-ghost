export type PetType = "ghost";

export type InteractionType = "pet" | "feed" | "play";

export type Pet = {
  id: string;
  name: string;
  type: PetType;
  happiness: number;
  energy: number;
  visits: number;
  lastUpdated: string;
  lastInteraction?: InteractionType;
  currentDialogue: string;
};

export type FocusSessionStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export interface FocusSession {
  id: string;
  taskLabel?: string;
  plannedMinutes: number;
  startTime: string;
  endTime?: string;
  elapsedSeconds: number;
  status: FocusSessionStatus;
  pausedAt?: string;
  totalPausedSeconds?: number;
}

export interface FocusSessionHistoryEntry {
  id: string;
  taskLabel?: string;
  plannedMinutes: number;
  actualMinutes: number;
  startTime: string;
  endTime: string;
  completed: boolean;
}

export type GhostMood =
  | "idle"
  | "happy"
  | "sleepy"
  | "focus"
  | "reacting";

export type GhostEmote =
  | "zzz"
  | "heart"
  | "sparkle"
  | "dotdotdot"
  | "star"
  | null;