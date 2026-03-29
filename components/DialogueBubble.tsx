type DialogueBubbleProps = {
  message: string;
};

export default function DialogueBubble({ message }: DialogueBubbleProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-sm text-white/90 shadow-lg backdrop-blur">
      {message}
    </div>
  );
}