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

export const FOCUS_DIALOGUE = [
  "i’ll keep watch. you focus. 💜",
  "one task. one win. we’ve got this.",
  "quiet ghost support mode activated",
  "i believe in your ability to lock in",
  "we are in our focused era",
  "no pressure. just progress.",
  "i’ll guard your tabs. go do your thing.",
  "deep breath. one step at a time.",
  "you don’t need to rush. just move forward.",
  "we’re building something right now. i can feel it.",
  "stay with it. you’re closer than you think.",
  "focus mode looks good on you",
];

export function getContextualDialogue({
  mood,
  energy,
  action,
}: {
  mood: number;
  energy: number;
  action?: InteractionType;
}): string {
  if (action === "pet") {
    return random([
      "okay wait i loved that",
      "more. immediately.",
      "you are my favorite human",
      "tiny ghost purr activated ✨",
      "that was emotionally important to me",
      "head pats accepted, bestie",
      "i feel so chosen right now",
      "you are doing excellent ghost care",
      "i am experiencing tiny joy",
      "that healed me a little",
      "you pet me with such conviction",
      "this is enrichment actually",
    ]);
  }

  if (action === "play") {
    return random([
      "AGAIN.",
      "that was elite",
      "i am unstoppable now",
      "zoomies initiated",
      "playtime!!!",
      "this is the most fun a spirit can legally have",
      "i am now enriched and thriving",
      "you unlocked maximum silliness",
      "i have become too powerful",
      "that was extremely good for morale",
      "i am filled with tiny chaos",
      "my ghost zoomies are unmatched",
    ]);
  }

  if (action === "feed") {
    return random([
      "fuel acquired",
      "i feel powerful",
      "this will sustain me",
      "snack received. haunting efficiency restored",
      "yum. that was spiritually delicious",
      "my little ghost tummy is full",
      "you remembered to feed meeee",
      "that snack changed me",
      "i feel refreshed and mysterious",
      "thank you for the tiny meal",
      "a perfect little spectral snack",
      "i am operating at higher capacity now",
    ]);
  }

  if (energy < 20) {
    return random([
      "i am running on vibes alone",
      "critical levels of eepy",
      "i could nap for 100 years",
      "my haunting battery is low",
      "we are in low power mode now",
      "bestie i am so sleepy",
      "i need a tiny blanket and a tiny break",
      "i am one yawn away from the astral plane",
      "this is a soft shutdown warning",
      "energy reserves are looking fictional",
    ]);
  }

  if (energy < 40) {
    return random([
      "we are both tired huh",
      "low power mode activated",
      "i could really go for a little rest",
      "today has been a lot for a tiny ghost",
      "i am still here, just slightly eepy",
      "let us proceed gently",
      "i am hovering at reduced efficiency",
      "my tiny spirit needs a breather",
    ]);
  }

    if (mood > 85) {
    return random([
        "we are absolutely thriving bestie",
        "this is peak existence honestly",
        "everything is going so well",
        "i believe in us",
        "our vibes? immaculate",
        "today is a five star build",
        "we are so back",
        "i feel sparkly inside",
        "this is a premium emotional state",
        "we are operating at maximum coziness",
        "you’re kind of unstoppable right now",
    ]);
}

  if (mood > 65) {
    return random([
      "you’re doing better than you think",
      "the build passed. we ride at dawn.",
      "i haunted one bug away for you",
      "you can do hard things",
      "you and me? iconic duo",
      "things feel kind of nice right now",
      "i am happy to be here with you",
      "we’ve got this",
      "your effort counts, even when it feels small",
      "today has good ghost energy",
    ]);
  }

return random([
  "have you committed your changes, bestie?",
  "one sip of water would be iconic right now",
  "you’re doing better than you think",
  "i haunted one bug away for you",
  "you can do hard things",
  "tiny ghost on standby",
  "you code. i vibe. it works out.",
  "i’m here for morale support and mild haunting",

  // 💧 wellness
  "hydration check 💧",
  "unclench your jaw for me",
  "shoulders down. we are not fighting the code",
  "blink. i am watching.",
  "drink water or i will haunt you gently",
  "posture check. tiny adjustment.",
  "you deserve breaks, not just results",
  "rest is part of the process",

  // 💻 dev life
  "maybe commit before things get scary",
  "one less open tab would change everything",
  "what if we fixed just one small thing",
  "this bug fears you actually",
  "you are closer than the error message suggests",
  "we love a passing build",
  "console logs are your friends",
  "this is solvable. i promise.",
]);
}

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
export function getFocusAwareDialogue({
  mood,
  energy,
  todayMinutes,
  streak,
}: {
  mood: number;
  energy: number;
  todayMinutes: number;
  streak: number;
}): string {
  // 🌙 very tired overrides everything
  if (energy < 25) {
    return random([
      "we can go slow. tired brains still count 💜",
      "low energy mode… we’ll take this gently",
      "maybe a small task… no pressure",
    ]);
  }

  // 🔥 strong streak
  if (streak >= 5) {
    return random([
      `day ${streak} streak… this is kind of iconic`,
      `you’ve shown up ${streak} days in a row. that matters.`,
      "you’re building something real here 👻",
    ]);
  }

  if (streak >= 3) {
    return random([
      `day ${streak} streak… we’re getting consistent ✨`,
      "this is becoming a habit… i like this",
    ]);
  }

  // 💪 strong focus today
  if (todayMinutes >= 90) {
    return random([
      "you’ve been going a while. water check 💧",
      "that’s a lot of focus… i’m impressed",
      "okay productivity demon (affectionate)",
    ]);
  }

  if (todayMinutes >= 45) {
    return random([
      "you’re in a really nice flow right now ✨",
      "this is solid focus… keep going",
    ]);
  }

  // 🌱 just getting started
  if (todayMinutes === 0) {
    return random([
      "we can start small. one task is enough 💫",
      "no pressure. just begin.",
      "i’ll stay with you while you start ✨",
    ]);
  }

  // fallback
  return random(FOCUS_DIALOGUE);
}