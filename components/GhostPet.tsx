"use client";

import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

type GhostPetProps = {
  mood: number;
  energy?: number;
  reaction?: string | null;
  focusMode?: boolean;
};

type AmbientEmote = "sparkle" | "heart" | "dotdotdot" | "star" | null;

function getGhostImage(mood: number) {
  if (mood >= 70) return "/ghosts/wisp-baby-boo.png";
  if (mood >= 40) return "/ghosts/wisp-baby-boo.png";
  return "/ghosts/wisp-baby-boo.png";
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function pickAmbientEmote(): AmbientEmote {
  const emotes: AmbientEmote[] = ["sparkle", "heart", "dotdotdot", "star"];
  return emotes[randomInt(0, emotes.length - 1)];
}

export default function GhostPet({
  mood,
  energy,
  reaction,
  focusMode = false,
}: GhostPetProps) {
  const src = getGhostImage(mood);

  const currentEnergy = typeof energy === "number" ? energy : 100;

  const isSleepy = currentEnergy < 35;
  const showSleepZs = currentEnergy <= 20 && !reaction && !focusMode;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const [ambientEmote, setAmbientEmote] = useState<AmbientEmote>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  const lastMouseMoveAtRef = useRef(Date.now());
  const ambientLookTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientEmoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ambientEmoteClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const x = (e.clientX - centerX) / centerX;
      const y = (e.clientY - centerY) / centerY;

      lastMouseMoveAtRef.current = Date.now();

      mouseX.set(Math.max(-1, Math.min(1, x)));
      mouseY.set(Math.max(-1, Math.min(1, y)));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const scheduleAmbientLook = () => {
      const delay = randomInt(2200, 4200);

      ambientLookTimeoutRef.current = setTimeout(() => {
        const inactiveForMs = Date.now() - lastMouseMoveAtRef.current;

        if (inactiveForMs >= 1800) {
          mouseX.set(randomBetween(-0.45, 0.45));
          mouseY.set(
            isSleepy ? randomBetween(0.1, 0.35) : randomBetween(-0.2, 0.35)
          );
        }

        scheduleAmbientLook();
      }, delay);
    };

    scheduleAmbientLook();

    return () => {
      if (ambientLookTimeoutRef.current) {
        clearTimeout(ambientLookTimeoutRef.current);
      }
    };
  }, [mouseX, mouseY, isSleepy]);

  useEffect(() => {
    const scheduleAmbientEmote = () => {
      const delay = randomInt(9000, 17000);

      ambientEmoteTimeoutRef.current = setTimeout(() => {
        if (!reaction && !showSleepZs) {
          const nextEmote = pickAmbientEmote();
          setAmbientEmote(nextEmote);

          ambientEmoteClearTimeoutRef.current = setTimeout(() => {
            setAmbientEmote(null);
          }, 1800);
        }

        scheduleAmbientEmote();
      }, delay);
    };

    scheduleAmbientEmote();

    return () => {
      if (ambientEmoteTimeoutRef.current) {
        clearTimeout(ambientEmoteTimeoutRef.current);
      }

      if (ambientEmoteClearTimeoutRef.current) {
        clearTimeout(ambientEmoteClearTimeoutRef.current);
      }
    };
  }, [reaction, showSleepZs]);

  useEffect(() => {
    const scheduleBlink = () => {
      const delay = isSleepy
        ? randomInt(2600, 4200)
        : focusMode
        ? randomInt(2200, 3600)
        : randomInt(2800, 5200);

      blinkTimeoutRef.current = setTimeout(() => {
        setIsBlinking(true);

        blinkCloseTimeoutRef.current = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, isSleepy ? 180 : 140);
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }

      if (blinkCloseTimeoutRef.current) {
        clearTimeout(blinkCloseTimeoutRef.current);
      }
    };
  }, [isSleepy, focusMode]);

  useEffect(() => {
    if (!reaction) return;
    setAmbientEmote(null);
  }, [reaction]);

  useEffect(() => {
    if (currentEnergy > 20) {
      setAmbientEmote((prev) => prev);
    }
  }, [currentEnergy]);

  const smoothX = useSpring(mouseX, {
    stiffness: isSleepy ? 55 : focusMode ? 80 : 120,
    damping: isSleepy ? 28 : focusMode ? 24 : 20,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: isSleepy ? 55 : focusMode ? 80 : 120,
    damping: isSleepy ? 28 : focusMode ? 24 : 20,
  });

  const pupilX = useTransform(
    smoothX,
    [-1, 1],
    isSleepy ? [-2, 2] : focusMode ? [-3, 3] : [-4, 4]
  );

  const pupilY = useTransform(
    smoothY,
    [-1, 1],
    isSleepy ? [1, 3] : focusMode ? [0, 3] : [-1, 5]
  );

  const scale =
    reaction === "pet"
      ? [1, 1.08, 1]
      : reaction === "play"
      ? [1, 1.14, 1]
      : reaction === "feed"
      ? [1, 1.06, 1]
      : reaction === "focus-start"
      ? [1, 1.08, 1.03, 1]
      : reaction === "focus-resume"
      ? [1, 1.06, 1]
      : reaction === "focus-complete"
      ? [1, 1.14, 1.08, 1]
      : reaction === "focus-pause"
      ? [1, 0.98, 1]
      : [1, 1, 1];

  const yFloat =
    reaction === "play"
      ? [0, -14, 0]
      : reaction === "focus-complete"
      ? [0, -16, 0]
      : reaction === "focus-start"
      ? [0, -12, 0]
      : reaction === "focus-resume"
      ? [0, -10, 0]
      : reaction === "focus-pause"
      ? [0, -4, 0]
      : [0, -10, 0];

  const glowClass = isSleepy
    ? "bg-slate-300/5"
    : focusMode
    ? "bg-indigo-300/6"
    : mood >= 70
    ? "bg-violet-300/10"
    : mood >= 40
    ? "bg-blue-300/8"
    : "bg-slate-300/6";

  const showAmbientEmote = !reaction && ambientEmote;
  const eyelidScaleY = isBlinking ? 1 : isSleepy ? 0.34 : 0;

  return (
    <div className="relative mx-auto flex h-72 w-64 items-center justify-center">
      <div className={`absolute h-36 w-36 rounded-full ${glowClass} blur-3xl`} />

      <AnimatePresence mode="wait">
        {showSleepZs ? (
          <motion.div key="sleepy-zs" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 6, x: 0, scale: 0.9 }}
              animate={{
                opacity: [0, 0.95, 0],
                y: -20,
                x: 4,
                scale: [0.9, 1.08, 1.14],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              className="pointer-events-none absolute right-[96px] top-[56px] z-20 text-sm font-semibold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]"
            >
              z
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8, x: 0, scale: 1 }}
              animate={{
                opacity: [0, 1, 0],
                y: -30,
                x: 10,
                scale: [1, 1.1, 1.18],
              }}
              transition={{
                duration: 2.7,
                delay: 0.35,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="pointer-events-none absolute right-[78px] top-[40px] z-20 text-lg font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]"
            >
              z
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10, x: 0, scale: 1.05 }}
              animate={{
                opacity: [0, 1, 0],
                y: -40,
                x: 18,
                scale: [1.05, 1.15, 1.24],
              }}
              transition={{
                duration: 3,
                delay: 0.8,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="pointer-events-none absolute right-[58px] top-[20px] z-20 text-xl font-semibold text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
            >
              z
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12, x: 0, scale: 0.95 }}
              animate={{
                opacity: [0, 0.9, 0],
                y: -24,
                x: -2,
                scale: [0.95, 1.04, 1.1],
              }}
              transition={{
                duration: 2.4,
                delay: 1.1,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="pointer-events-none absolute right-[110px] top-[46px] z-20 text-sm font-semibold text-white/95 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]"
            >
              z
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8, x: 0, scale: 0.9 }}
              animate={{
                opacity: [0, 0.85, 0],
                y: -34,
                x: 24,
                scale: [0.9, 1.05, 1.12],
              }}
              transition={{
                duration: 3.2,
                delay: 1.45,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="pointer-events-none absolute right-[40px] top-[14px] z-20 text-base font-semibold text-white/95 drop-shadow-[0_0_10px_rgba(255,255,255,0.65)]"
            >
              z
            </motion.div>
          </motion.div>
        ) : null}

        {reaction === "pet" && (
          <>
            <motion.div
              key="heart-left"
              initial={{ opacity: 0, y: 10, scale: 0.6 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -55,
                scale: [0.6, 1, 1.05, 0.9],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="pointer-events-none absolute left-[72px] top-[88px] z-20 text-2xl"
            >
              💖
            </motion.div>

            <motion.div
              key="heart-right"
              initial={{ opacity: 0, y: 12, scale: 0.55 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -48,
                scale: [0.55, 0.95, 1.05, 0.85],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, delay: 0.08, ease: "easeOut" }}
              className="pointer-events-none absolute right-[72px] top-[96px] z-20 text-xl"
            >
              💕
            </motion.div>
          </>
        )}

        {reaction === "play" && (
          <>
            <motion.div
              key="sparkle-left"
              initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1, 1.1, 0.8],
                y: [-2, -18, -28],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="pointer-events-none absolute left-[76px] top-[90px] z-20 text-xl"
            >
              ✨
            </motion.div>

            <motion.div
              key="sparkle-right"
              initial={{ opacity: 0, scale: 0.4, rotate: 10 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.4, 1, 1.1, 0.8],
                y: [-2, -16, -26],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: "easeOut" }}
              className="pointer-events-none absolute right-[76px] top-[92px] z-20 text-xl"
            >
              ✨
            </motion.div>
          </>
        )}

        {reaction === "feed" && (
          <motion.div
            key="feed-sparkle"
            initial={{ opacity: 0, y: 8, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -36,
              scale: [0.5, 1, 1.05, 0.85],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="pointer-events-none absolute top-[88px] z-20 text-xl"
          >
            ✨
          </motion.div>
        )}

        {showAmbientEmote === "sparkle" && (
          <motion.div
            key="ambient-sparkle"
            initial={{ opacity: 0, y: 10, scale: 0.75 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -24,
              scale: [0.75, 1, 1.05, 0.95],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="pointer-events-none absolute right-[70px] top-[64px] z-20 text-lg text-white/90"
          >
            ✨
          </motion.div>
        )}

        {showAmbientEmote === "heart" && (
          <motion.div
            key="ambient-heart"
            initial={{ opacity: 0, y: 8, scale: 0.75 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -22,
              scale: [0.75, 1, 1.04, 0.95],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="pointer-events-none absolute left-[74px] top-[76px] z-20 text-lg"
          >
            💜
          </motion.div>
        )}

        {showAmbientEmote === "dotdotdot" && (
          <motion.div
            key="ambient-dots"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{
              opacity: [0, 0.9, 0.9, 0],
              y: -18,
              scale: [0.9, 1, 1, 0.96],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="pointer-events-none absolute right-[68px] top-[68px] z-20 text-sm text-white/80"
          >
            ...
          </motion.div>
        )}

        {showAmbientEmote === "star" && (
          <motion.div
            key="ambient-star"
            initial={{ opacity: 0, y: 8, scale: 0.7, rotate: -10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -20,
              scale: [0.7, 1, 1.08, 0.92],
              rotate: [-10, 4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="pointer-events-none absolute left-[84px] top-[62px] z-20 text-base text-white/90"
          >
            ★
          </motion.div>
        )}

        {reaction === "focus-start" && (
          <>
            <motion.div
              key="focus-start-left"
              initial={{ opacity: 0, y: 10, scale: 0.5, rotate: -10 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -42,
                x: -18,
                scale: [0.5, 1, 1.08, 0.85],
                rotate: [-10, 4, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="pointer-events-none absolute left-[70px] top-[86px] z-20 text-xl"
            >
              ✨
            </motion.div>

            <motion.div
              key="focus-start-right"
              initial={{ opacity: 0, y: 8, scale: 0.5, rotate: 8 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -40,
                x: 18,
                scale: [0.5, 1, 1.08, 0.85],
                rotate: [8, -4, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, delay: 0.05, ease: "easeOut" }}
              className="pointer-events-none absolute right-[70px] top-[88px] z-20 text-xl"
            >
              ✨
            </motion.div>
          </>
        )}

        {reaction === "focus-pause" && (
          <motion.div
            key="focus-pause-dots"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{
              opacity: [0, 0.9, 0.9, 0],
              y: -18,
              scale: [0.9, 1, 1, 0.96],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="pointer-events-none absolute top-[78px] z-20 text-sm text-white/85"
          >
            ...
          </motion.div>
        )}

        {reaction === "focus-resume" && (
          <motion.div
            key="focus-resume-star"
            initial={{ opacity: 0, y: 8, scale: 0.7, rotate: -8 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -28,
              scale: [0.7, 1, 1.08, 0.9],
              rotate: [-8, 6, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="pointer-events-none absolute top-[82px] z-20 text-lg text-white"
          >
            ★
          </motion.div>
        )}

        {reaction === "focus-complete" && (
          <>
            <motion.div
              key="focus-complete-left"
              initial={{ opacity: 0, y: 12, scale: 0.55 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -56,
                x: -20,
                scale: [0.55, 1.05, 1.1, 0.9],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="pointer-events-none absolute left-[72px] top-[92px] z-20 text-2xl"
            >
              💖
            </motion.div>

            <motion.div
              key="focus-complete-mid"
              initial={{ opacity: 0, y: 10, scale: 0.45 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -48,
                scale: [0.45, 1, 1.08, 0.88],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, delay: 0.05, ease: "easeOut" }}
              className="pointer-events-none absolute top-[74px] z-20 text-xl"
            >
              ✨
            </motion.div>

            <motion.div
              key="focus-complete-right"
              initial={{ opacity: 0, y: 12, scale: 0.55 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -56,
                x: 20,
                scale: [0.55, 1.05, 1.1, 0.9],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.08, ease: "easeOut" }}
              className="pointer-events-none absolute right-[72px] top-[92px] z-20 text-2xl"
            >
              💕
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          y: reaction
            ? yFloat
            : isSleepy
            ? [0, -6, 0]
            : focusMode
            ? [0, -7, 0]
            : [0, -10, 0],
          x: reaction
            ? 0
            : isSleepy
            ? [0, 2, 0, -2, 0]
            : focusMode
            ? [0, 2, 0, -2, 0]
            : [0, 4, 0, -4, 0],
          scale,
          rotate: reaction
            ? reaction === "play"
              ? [0, -2, 2, 0]
              : reaction === "focus-complete"
              ? [0, -2, 2, -1, 1, 0]
              : reaction === "focus-start"
              ? [0, -1, 1, 0]
              : 0
            : isSleepy
            ? [0, 0.5, 0, -0.5, 0]
            : focusMode
            ? [0, 0.6, 0, -0.6, 0]
            : [0, 1.2, 0, -1.2, 0],
        }}
        transition={{
          y: {
            duration: reaction ? 0.5 : isSleepy ? 4.5 : focusMode ? 3.8 : 2.8,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          x: {
            duration: reaction ? 0.5 : isSleepy ? 5 : focusMode ? 5 : 4.2,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          scale: {
            duration: reaction ? 0.5 : 2.8,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          rotate: {
            duration: reaction ? 0.45 : isSleepy ? 5 : focusMode ? 5 : 4.2,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
        }}
        whileTap={{ scale: 0.95 }}
        className="relative z-10"
      >
        <div className="relative h-[220px] w-[220px]">
          <Image
            src={src}
            alt="Wisp the ghost companion"
            width={220}
            height={220}
            priority
            className="select-none"
          />

          <div className="absolute left-[82px] top-[76px] h-[26px] w-[26px] overflow-hidden rounded-full">
            <div className="absolute inset-0 rounded-full bg-[#24142c]" />

            <motion.div style={{ x: pupilX, y: pupilY }} className="absolute inset-0">
              <div className="absolute left-[5px] top-[4px] h-[10px] w-[10px] rounded-full bg-white" />
              <div className="absolute left-[3px] top-[15px] h-[5px] w-[5px] rounded-full bg-white" />
              <div className="absolute left-[18px] top-[16px] h-[4px] w-[4px] rounded-full bg-white/80" />
            </motion.div>

            <motion.div
              animate={{ scaleY: eyelidScaleY }}
              transition={{ duration: isBlinking ? 0.12 : 0.2, ease: "easeInOut" }}
              className="absolute inset-0 origin-top rounded-full bg-[#eef4ff]"
            />
          </div>

          <div className="absolute left-[120px] top-[76px] h-[26px] w-[26px] overflow-hidden rounded-full">
            <div className="absolute inset-0 rounded-full bg-[#24142c]" />

            <motion.div style={{ x: pupilX, y: pupilY }} className="absolute inset-0">
              <div className="absolute left-[5px] top-[4px] h-[10px] w-[10px] rounded-full bg-white" />
              <div className="absolute left-[3px] top-[15px] h-[5px] w-[5px] rounded-full bg-white" />
              <div className="absolute left-[18px] top-[16px] h-[4px] w-[4px] rounded-full bg-white/80" />
            </motion.div>

            <motion.div
              animate={{ scaleY: eyelidScaleY }}
              transition={{ duration: isBlinking ? 0.12 : 0.2, ease: "easeInOut" }}
              className="absolute inset-0 origin-top rounded-full bg-[#eef4ff]"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{
          scaleX: reaction
            ? reaction === "play"
              ? [1, 0.78, 1]
              : [1, 0.86, 1]
            : isSleepy
            ? [1, 0.95, 1]
            : focusMode
            ? [1, 0.94, 1]
            : [1, 0.9, 1, 0.86, 1],
          x: reaction
            ? 0
            : isSleepy
            ? [0, 1, 0, -1, 0]
            : focusMode
            ? [0, 1, 0, -1, 0]
            : [0, 3, 0, -3, 0],
          opacity: reaction
            ? [0.12, 0.18, 0.12]
            : isSleepy
            ? [0.08, 0.12, 0.08]
            : focusMode
            ? [0.08, 0.12, 0.08]
            : [0.1, 0.16, 0.1],
        }}
        transition={{
          scaleX: {
            duration: reaction ? 0.5 : isSleepy ? 4.5 : focusMode ? 4.2 : 4.2,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          x: {
            duration: reaction ? 0.5 : isSleepy ? 5 : focusMode ? 5 : 4.2,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          opacity: {
            duration: reaction ? 0.5 : isSleepy ? 4.5 : focusMode ? 4.2 : 2.8,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
        }}
        className="absolute bottom-7 h-4 w-20 rounded-full bg-black/20 blur-md"
      />
    </div>
  );
}