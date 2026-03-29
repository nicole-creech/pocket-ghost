"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type SidebarSectionProps = {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function SidebarSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: SidebarSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 truncate text-xs text-white/55">{subtitle}</p>
          ) : null}
        </div>

        <span className="shrink-0 text-sm text-white/55">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 px-4 py-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}