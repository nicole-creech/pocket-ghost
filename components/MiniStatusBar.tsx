"use client";

type MiniStatusBarProps = {
  label: string;
  value: number;
};

export default function MiniStatusBar({ label, value }: MiniStatusBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-white/55">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-white/70 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}