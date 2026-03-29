"use client";

import { useEffect, useMemo, useState } from "react";
import ActionPanel from "@/components/ActionPanel";
import DialogueBubble from "@/components/DialogueBubble";
import GhostPet from "@/components/GhostPet";
import StatusBar from "@/components/StatusBar";
import { DEFAULT_PET, getRandomDialogue } from "@/lib/pet-data";
import { loadPet, savePet } from "@/lib/storage";
import { InteractionType, Pet } from "@/lib/types";

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function applyLightDecay(pet: Pet): Pet {
  const now = new Date();
  const lastUpdated = new Date(pet.lastUpdated);
  const diffMs = now.getTime() - lastUpdated.getTime();
  const hoursPassed = Math.floor(diffMs / (1000 * 60 * 60));

  if (hoursPassed <= 0) return pet;

  return {
    ...pet,
    happiness: clamp(pet.happiness - hoursPassed * 2),
    energy: clamp(pet.energy - hoursPassed * 3),
    lastUpdated: now.toISOString(),
  };
}

export default function HomePage() {
  const [pet, setPet] = useState<Pet>(DEFAULT_PET);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  useEffect(() => {
    const savedPet = loadPet();

    if (savedPet) {
      const updatedPet = applyLightDecay({
        ...savedPet,
        visits: (savedPet.visits ?? 0) + 1,
      });
      setPet(updatedPet);
      savePet(updatedPet);
    } else {
      savePet(DEFAULT_PET);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    savePet(pet);
  }, [pet, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setPet((current) => ({
        ...current,
        happiness: clamp(current.happiness - 1),
        energy: clamp(current.energy - 1),
        lastUpdated: new Date().toISOString(),
      }));
    }, 45000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setPet((current) => ({
        ...current,
        currentDialogue: getRandomDialogue(),
      }));
    }, 20000);

    return () => clearInterval(interval);
  }, [isLoaded]);

  const handleAction = (action: InteractionType) => {
    setReaction(action);
    setTimeout(() => setReaction(null), 700);

    setPet((current) => {
      let happinessBoost = 0;
      let energyBoost = 0;

      switch (action) {
        case "pet":
          happinessBoost = 8;
          energyBoost = -2;
          break;
        case "feed":
          happinessBoost = 4;
          energyBoost = 10;
          break;
        case "play":
          happinessBoost = 12;
          energyBoost = -8;
          break;
      }

      return {
        ...current,
        happiness: clamp(current.happiness + happinessBoost),
        energy: clamp(current.energy + energyBoost),
        lastInteraction: action,
        currentDialogue: getRandomDialogue(action),
        lastUpdated: new Date().toISOString(),
      };
    });
  };

  const vibeText = useMemo(() => {
    if (pet.happiness >= 75 && pet.energy >= 60) return "thriving";
    if (pet.happiness >= 45 && pet.energy >= 35) return "cozy";
    return "sleepy";
  }, [pet.happiness, pet.energy]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1020] text-white">
        <p className="text-sm text-white/70">summoning your ghost...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.22),_transparent_35%),linear-gradient(180deg,_#0f1020_0%,_#17182d_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Pocket Ghost
            </p>
            <input
              value={pet.name}
              onChange={(e) =>
                setPet((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mt-2 w-full bg-transparent text-center text-3xl font-semibold outline-none"
            />
            <p className="mt-2 text-sm text-white/60">
              your tiny spectral coding companion
            </p>
          </div>

          <div className="my-4">
            <GhostPet mood={pet.happiness} reaction={reaction} />
          </div>

          <div className="mt-6">
            <DialogueBubble message={pet.currentDialogue} />
          </div>

          <div className="mt-6 space-y-4">
            <StatusBar label="Happiness" value={pet.happiness} />
            <StatusBar label="Energy" value={pet.energy} />
          </div>

          <div className="mt-6">
            <ActionPanel onAction={handleAction} />
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-white/50">
            <span>mood: {vibeText}</span>
            <span>visits: {pet.visits}</span>
          </div>
        </section>
      </div>
    </main>
  );
}