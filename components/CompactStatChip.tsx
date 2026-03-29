"use client";

type CompactStatChipProps = {
  label: string;
  value: string | number;
};

export default function CompactStatChip({
  label,
  value,
}: CompactStatChipProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}