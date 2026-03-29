"use client";

import { FocusSessionHistoryEntry } from "@/lib/types";

type FocusHistoryCardProps = {
  totalSessions: number;
  totalMinutes: number;
  recentSessions: FocusSessionHistoryEntry[];
  topLabel: string | null;
  completionRate: number;
};

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
  return trimmed && trimmed.length > 0 ? trimmed : "Unlabeled session";
}

export default function FocusHistoryCard({
  totalSessions,
  totalMinutes,
  recentSessions,
  topLabel,
  completionRate,
}: FocusHistoryCardProps) {
  return (
    <div className="mt-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Focus History
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            your tiny archive of effort
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Completion
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {completionRate}%
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Sessions
          </p>
          <p className="mt-1 text-sm text-white">{totalSessions}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Minutes
          </p>
          <p className="mt-1 text-sm text-white">{totalMinutes}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Top Label
          </p>
          <p className="mt-1 truncate text-sm text-white">
            {topLabel ?? "None yet"}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          Recent Sessions
        </p>

        {recentSessions.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/55">
            no focus sessions yet. your ghost believes in your future productivity arc ✨
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {recentSessions.map((session) => {
              const completed = session.status === "completed";

              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {getSessionTitle(session)}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        {formatSessionDate(session.endTime)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        completed
                          ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                          : "border border-rose-300/20 bg-rose-300/10 text-rose-100"
                      }`}
                    >
                      {completed ? "Completed" : "Cancelled"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm text-white/75">
                    <span>{session.actualMinutes} min focused</span>
                    <span className="text-white/45">
                      planned {session.plannedMinutes} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}