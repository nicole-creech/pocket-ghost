type Props = {
  todayMinutes: number;
  todaySessions: number;
  streak: number;
};

function getWispTodayLine(minutes: number, streak: number) {
  if (minutes === 0) {
    return "we can start small today. i’ll stay with you ✨";
  }

  if (streak >= 3) {
    return `day ${streak} streak… this is becoming a ritual 👻`;
  }

  if (minutes >= 60) {
    return "that’s some serious focus energy 💜";
  }

  return "you’re doing great. keep going 💫";
}

export default function FocusTodayCard({
  todayMinutes,
  todaySessions,
  streak,
}: Props) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">
        Today
      </p>

      <p className="mt-2 text-sm text-white/70">
        {getWispTodayLine(todayMinutes, streak)}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-black/10 px-3 py-3 text-center">
          <p className="text-xs text-white/40">minutes</p>
          <p className="text-lg text-white">{todayMinutes}</p>
        </div>

        <div className="rounded-xl bg-black/10 px-3 py-3 text-center">
          <p className="text-xs text-white/40">sessions</p>
          <p className="text-lg text-white">{todaySessions}</p>
        </div>

        <div className="rounded-xl bg-black/10 px-3 py-3 text-center">
          <p className="text-xs text-white/40">streak</p>
          <p className="text-lg text-white">{streak}</p>
        </div>
      </div>
    </div>
  );
}