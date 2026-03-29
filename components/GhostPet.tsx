"use client";

import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

type GhostPetProps = {
  mood: number;
  reaction?: string | null;
};

function getGhostImage(mood: number) {
  if (mood >= 70) return "/ghosts/wisp-baby-boo.png";
  if (mood >= 40) return "/ghosts/wisp-baby-boo.png";
  return "/ghosts/wisp-baby-boo.png";
}

export default function GhostPet({ mood, reaction }: GhostPetProps) {
  const src = getGhostImage(mood);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const x = (e.clientX - centerX) / centerX;
      const y = (e.clientY - centerY) / centerY;

      mouseX.set(Math.max(-1, Math.min(1, x)));
      mouseY.set(Math.max(-1, Math.min(1, y)));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const smoothX = useSpring(mouseX, { stiffness: 140, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 140, damping: 20 });

  const pupilX = useTransform(smoothX, [-1, 1], [-4, 4]);
  const pupilY = useTransform(smoothY, [-1, 1], [-3, 3]);

  const scale =
    reaction === "pet"
      ? [1, 1.08, 1]
      : reaction === "play"
      ? [1, 1.14, 1]
      : reaction === "feed"
      ? [1, 1.06, 1]
      : [1, 1, 1];

  const yFloat = reaction === "play" ? [0, -14, 0] : [0, -10, 0];

  const glowClass =
    mood >= 70
      ? "bg-violet-300/10"
      : mood >= 40
      ? "bg-blue-300/8"
      : "bg-slate-300/6";

  return (
    <div className="relative mx-auto flex h-72 w-64 items-center justify-center">
      <div className={`absolute h-36 w-36 rounded-full ${glowClass} blur-3xl`} />

      <AnimatePresence>
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
      </AnimatePresence>

      <motion.div
        animate={{
          y: reaction ? yFloat : [0, -10, 0],
          x: reaction ? 0 : [0, 4, 0, -4, 0],
          scale: scale,
          rotate: reaction
            ? reaction === "play"
              ? [0, -2, 2, 0]
              : 0
            : [0, 1.2, 0, -1.2, 0],
        }}
        transition={{
          y: {
            duration: reaction ? 0.5 : 2.8,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          x: {
            duration: 4.2,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          scale: {
            duration: reaction ? 0.5 : 2.8,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          rotate: {
            duration: reaction ? 0.45 : 4.2,
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

          {/* Left eye */}
          <div className="absolute left-[82px] top-[76px] h-[26px] w-[26px] overflow-hidden rounded-full">
            <div className="absolute inset-0 rounded-full bg-[#24142c]" />

            <motion.div
              style={{ x: pupilX, y: pupilY }}
              className="absolute inset-0"
            >
              <div className="absolute left-[5px] top-[4px] h-[10px] w-[10px] rounded-full bg-white" />
              <div className="absolute left-[3px] top-[15px] h-[5px] w-[5px] rounded-full bg-white" />
              <div className="absolute left-[18px] top-[16px] h-[4px] w-[4px] rounded-full bg-white/80" />
            </motion.div>

            <motion.div
              animate={{
                scaleY: [0, 0, 0, 1, 0, 0, 0],
              }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.78, 0.82, 0.86, 0.9, 0.96, 1],
              }}
              className="absolute inset-0 origin-top rounded-full bg-[#eef4ff]"
            />
          </div>

          {/* Right eye */}
          <div className="absolute left-[120px] top-[76px] h-[26px] w-[26px] overflow-hidden rounded-full">
            <div className="absolute inset-0 rounded-full bg-[#24142c]" />

            <motion.div
              style={{ x: pupilX, y: pupilY }}
              className="absolute inset-0"
            >
              <div className="absolute left-[5px] top-[4px] h-[10px] w-[10px] rounded-full bg-white" />
              <div className="absolute left-[3px] top-[15px] h-[5px] w-[5px] rounded-full bg-white" />
              <div className="absolute left-[18px] top-[16px] h-[4px] w-[4px] rounded-full bg-white/80" />
            </motion.div>

            <motion.div
              animate={{
                scaleY: [0, 0, 0, 1, 0, 0, 0],
              }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.78, 0.82, 0.86, 0.9, 0.96, 1],
              }}
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
            : [1, 0.9, 1, 0.86, 1],
          x: reaction ? 0 : [0, 3, 0, -3, 0],
          opacity: reaction ? [0.12, 0.18, 0.12] : [0.1, 0.16, 0.1],
        }}
        transition={{
          scaleX: {
            duration: reaction ? 0.5 : 4.2,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          x: {
            duration: 4.2,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
          opacity: {
            duration: reaction ? 0.5 : 2.8,
            ease: "easeInOut",
            repeat: reaction ? 0 : Infinity,
          },
        }}
        className="absolute bottom-7 h-4 w-20 rounded-full bg-black/20 blur-md"
      />
    </div>
  );
}