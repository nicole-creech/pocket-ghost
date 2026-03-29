import { InteractionType } from "@/lib/types";

type ActionPanelProps = {
  onAction: (action: InteractionType) => void;
};

const actions: InteractionType[] = ["pet", "feed", "play"];

export default function ActionPanel({ onAction }: ActionPanelProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium capitalize text-white transition hover:scale-[1.05] hover:bg-white/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-[0.98]"
        >
          {action}
        </button>
      ))}
    </div>
  );
}