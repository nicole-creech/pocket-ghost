import { Pet } from "./types";

const STORAGE_KEY = "pocket-ghost-save";

export function savePet(pet: Pet) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
}

export function loadPet(): Pet | null {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as Pet;
  } catch {
    return null;
  }
}