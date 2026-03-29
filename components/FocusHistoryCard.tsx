type FocusHistoryItem = {
  id: string;
  actualMinutes: number;
  completed: boolean;
  endTime: string;
};

type FocusHistoryCardProps = {
  totalSessions: number;
  totalMinutes: number;
  recentSessions: FocusHistoryItem[];
};

function formatSessionTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getWispHistoryLine(totalSessions: number, totalMinutes: number) {
  if (totalSessions === 0) {
    return "we can start tiny. one cozy focus session is enough ✨";
  }

  if (totalMinutes >= 120) {
    return "you have been working so hard. tiny ghost is very impressed ✨";
  }

  if (totalMinutes >= 60) {
    return "look at you go. that is some real focus magic 💜";
  }

  if (totalSessions >= 3) {
    return "three whole sessions? okay productivity legend 👻";
  }

  return "every little session counts. i am proud of you 💫";
}

export default function FocusHistoryCard({
  totalSessions,
  totalMinutes,
  recentSessions,
}: FocusHistoryCardProps) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">
            Focus History
          </p>
          <p className="mt-2 text-sm text-white/70">
            {getWispHistoryLine(totalSessions, totalMinutes)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-white">{totalSessions}</p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            sessions
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
            total focused
          </p>
          <p className="mt-1 text-base font-medium text-white">
            {totalMinutes} min
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-black/10 px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
            completed
          </p>
          <p className="mt-1 text-base font-medium text-white">
            {recentSessions.filter((session) => session.completed).length} recent
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
          recent sessions
        </p>

        <div className="mt-2 space-y-2">
          {recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-sm text-white/45">
              no focus sessions yet
            </div>
          ) : (
            recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-black/10 px-3 py-3"
              >
                <div>
                  <p className="text-sm text-white">
                    {session.actualMinutes} min
                  </p>
                  <p className="text-xs text-white/45">
                    {formatSessionTime(session.endTime)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.14em] ${
                    session.completed
                      ? "bg-emerald-300/12 text-emerald-200"
                      : "bg-white/8 text-white/55"
                  }`}
                >
                  {session.completed ? "complete" : "ended early"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}