"use client";

import type { GhostMood } from "@/lib/types";

type AmbientProps = {
  isBlinking: boolean;
  lookX: number;
  lookY: number;
  floatOffset: number;
  mood: GhostMood;
};

type GhostSpriteProps = {
  ambient: AmbientProps;
};

const moodMouthMap: Record<GhostMood, string> = {
  idle: "rounded-full",
  happy: "rounded-full",
  sleepy: "rounded-full scale-y-50",
  focus: "rounded-sm",
  reacting: "rounded-full",
};

export function GhostSprite({ ambient }: GhostSpriteProps) {
  const pupilTranslateX = ambient.lookX * 4;
  const pupilTranslateY = ambient.lookY * 3;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="relative transition-transform duration-500 ease-out"
        style={{
          transform: `translateY(${ambient.floatOffset}px)`,
        }}
      >
        <div className="relative h-40 w-36">
          <div className="absolute inset-0 rounded-[45%] bg-white shadow-[0_8px_30px_rgba(255,255,255,0.18)]" />

          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-3">
            <div className="h-6 w-6 rounded-full bg-white" />
            <div className="h-6 w-6 rounded-full bg-white" />
            <div className="h-6 w-6 rounded-full bg-white" />
          </div>

          <div className="absolute left-[28%] top-[34%] h-8 w-6 -translate-x-1/2">
            <div
              className="absolute inset-0 overflow-hidden rounded-full bg-black/10 transition-all duration-150"
              style={{
                transform: ambient.isBlinking ? "scaleY(0.15)" : "scaleY(1)",
                transformOrigin: "center",
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-4 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 transition-transform duration-500"
                style={{
                  transform: `translate(calc(-50% + ${pupilTranslateX}px), calc(-50% + ${pupilTranslateY}px))`,
                }}
              />
            </div>
          </div>

          <div className="absolute left-[72%] top-[34%] h-8 w-6 -translate-x-1/2">
            <div
              className="absolute inset-0 overflow-hidden rounded-full bg-black/10 transition-all duration-150"
              style={{
                transform: ambient.isBlinking ? "scaleY(0.15)" : "scaleY(1)",
                transformOrigin: "center",
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-4 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 transition-transform duration-500"
                style={{
                  transform: `translate(calc(-50% + ${pupilTranslateX}px), calc(-50% + ${pupilTranslateY}px))`,
                }}
              />
            </div>
          </div>

          <div
            className={`absolute left-1/2 top-[62%] h-2 w-8 -translate-x-1/2 bg-slate-900 transition-all duration-300 ${moodMouthMap[ambient.mood]}`}
          />
        </div>
      </div>
    </div>
  );
}