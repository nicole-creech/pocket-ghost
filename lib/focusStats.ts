import { FocusSessionHistoryEntry } from "./types";

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getTodaySessions(
  history: FocusSessionHistoryEntry[]
) {
  const today = new Date();

  return history.filter((session) =>
    isSameDay(new Date(session.endTime), today)
  );
}

export function getTodayMinutes(
  history: FocusSessionHistoryEntry[]
) {
  return getTodaySessions(history).reduce(
    (sum, s) => sum + s.actualMinutes,
    0
  );
}

export function getCurrentStreak(
  history: FocusSessionHistoryEntry[]
) {
  if (history.length === 0) return 0;

  const days = new Set(
    history.map((s) => {
      const d = new Date(s.endTime);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (days.has(key)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}