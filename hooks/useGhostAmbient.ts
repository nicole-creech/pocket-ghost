"use client";

import { useEffect, useRef, useState } from "react";
import type { GhostEmote, GhostMood } from "@/lib/types";

type UseGhostAmbientOptions = {
  isFocusMode?: boolean;
  isInteracting?: boolean;
  inactivityMs?: number;
};

type AmbientState = {
  isBlinking: boolean;
  lookX: number;
  lookY: number;
  floatOffset: number;
  mood: GhostMood;
  emote: GhostEmote;
};

const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const randomInt = (min: number, max: number) =>
  Math.floor(randomBetween(min, max + 1));

const pickRandomEmote = (): GhostEmote => {
  const pool: GhostEmote[] = ["heart", "sparkle", "dotdotdot", "star"];
  return pool[randomInt(0, pool.length - 1)];
};

export function useGhostAmbient({
  isFocusMode = false,
  isInteracting = false,
  inactivityMs = 45000,
}: UseGhostAmbientOptions) {
  const [ambient, setAmbient] = useState<AmbientState>({
    isBlinking: false,
    lookX: 0,
    lookY: 0,
    floatOffset: 0,
    mood: isFocusMode ? "focus" : "idle",
    emote: null,
  });

  const lastInteractionRef = useRef<number>(Date.now());

  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emoteClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const floatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isInteracting) {
      lastInteractionRef.current = Date.now();
      setAmbient((prev) => ({
        ...prev,
        mood: isFocusMode ? "focus" : "idle",
      }));
    }
  }, [isInteracting, isFocusMode]);

  useEffect(() => {
    setAmbient((prev) => ({
      ...prev,
      mood: isFocusMode ? "focus" : prev.mood === "sleepy" ? "sleepy" : "idle",
    }));
  }, [isFocusMode]);

  useEffect(() => {
    const scheduleBlink = () => {
      const delay = randomInt(2200, 5200);

      blinkTimeoutRef.current = setTimeout(() => {
        setAmbient((prev) => ({ ...prev, isBlinking: true }));

        blinkCloseTimeoutRef.current = setTimeout(() => {
          setAmbient((prev) => ({ ...prev, isBlinking: false }));
          scheduleBlink();
        }, randomInt(120, 180));
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
      if (blinkCloseTimeoutRef.current) clearTimeout(blinkCloseTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const scheduleLook = () => {
      const delay = randomInt(1800, 4000);

      lookTimeoutRef.current = setTimeout(() => {
        setAmbient((prev) => ({
          ...prev,
          lookX: randomBetween(-0.7, 0.7),
          lookY: randomBetween(-0.35, 0.45),
        }));

        scheduleLook();
      }, delay);
    };

    scheduleLook();

    return () => {
      if (lookTimeoutRef.current) clearTimeout(lookTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    floatIntervalRef.current = setInterval(() => {
      const t = Date.now() / 700;
      const offset = Math.sin(t) * 3;
      setAmbient((prev) => ({
        ...prev,
        floatOffset: offset,
      }));
    }, 80);

    return () => {
      if (floatIntervalRef.current) clearInterval(floatIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const scheduleEmote = () => {
      const delay = randomInt(9000, 18000);

      emoteTimeoutRef.current = setTimeout(() => {
        const emote: GhostEmote = pickRandomEmote();

        setAmbient((prev) => ({
          ...prev,
          emote,
        }));

        emoteClearTimeoutRef.current = setTimeout(() => {
          setAmbient((prev) => ({
            ...prev,
            emote: null,
          }));
        }, 1800);

        scheduleEmote();
      }, delay);
    };

    scheduleEmote();

    return () => {
      if (emoteTimeoutRef.current) clearTimeout(emoteTimeoutRef.current);
      if (emoteClearTimeoutRef.current) clearTimeout(emoteClearTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    sleepyIntervalRef.current = setInterval(() => {
      const inactiveFor = Date.now() - lastInteractionRef.current;
      const shouldBeSleepy = !isFocusMode && inactiveFor >= inactivityMs;

      setAmbient((prev) => {
        const nextMood: GhostMood = shouldBeSleepy
          ? "sleepy"
          : isFocusMode
          ? "focus"
          : "idle";

        if (prev.mood === nextMood) return prev;

        return {
          ...prev,
          mood: nextMood,
        };
      });
    }, 2000);

    return () => {
      if (sleepyIntervalRef.current) clearInterval(sleepyIntervalRef.current);
    };
  }, [isFocusMode, inactivityMs]);

  const notifyInteraction = () => {
    lastInteractionRef.current = Date.now();
    setAmbient((prev) => ({
      ...prev,
      mood: isFocusMode ? "focus" : "idle",
      emote: null,
    }));
  };

  return {
    ambient,
    notifyInteraction,
  };
}