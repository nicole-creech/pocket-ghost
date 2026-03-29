import { InteractionType, Pet } from "./types";

export const DEFAULT_PET: Pet = {
  id: "wisp-001",
  name: "Wisp",
  type: "ghost",
  happiness: 78,
  energy: 72,
  visits: 1,
  lastUpdated: new Date().toISOString(),
  currentDialogue: "hi bestie... i kept your tab warm ✨",
};

const DIALOGUE_BY_ACTION: Record<InteractionType, string[]> = {
  pet: [
    "tiny ghost purr activated ✨",
    "you are very good at this actually",
    "i feel emotionally supported now",
    "head pats accepted, bestie",
  ],
  feed: [
    "snack received. haunting efficiency restored",
    "yum. that was spiritually delicious",
    "my little ghost tummy is full",
    "you remembered to feed meeee",
  ],
  play: [
    "zoomies initiated",
    "this is the most fun a spirit can legally have",
    "playtime!!!",
    "i am now enriched and thriving",
  ],
};

export const IDLE_DIALOGUES = [
  "have you committed your changes, bestie?",
  "you’re doing better than you think",
  "one sip of water would be iconic right now",
  "the build passed. we ride at dawn.",
  "i haunted one bug away for you",
  "you can do hard things",
];

export function getRandomDialogue(action?: InteractionType): string {
  if (!action) {
    return IDLE_DIALOGUES[Math.floor(Math.random() * IDLE_DIALOGUES.length)];
  }

  const pool = DIALOGUE_BY_ACTION[action];
  return pool[Math.floor(Math.random() * pool.length)];
}