import {
  ContextualDialogueParams,
  FocusAwareDialogueParams,
  InteractionType,
  Pet,
  StatsAwareDialogueParams,
} from "./types";

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

export const IDLE_LINES = [
  "just floating around and cheering you on",
  "tiny ghost quality check: shoulders relaxed?",
  "you’re doing better than you think",
  "hydrate check, little coder",
];

export const SLEEPY_LINES = [
  "i got a little eepy waiting here...",
  "we can go gentle, no pressure",
  "maybe a stretch break soon?",
  "ghost says blink your human eyes too",
];

export const FOCUS_LINES = [
  "laser focus mode activated",
  "one task at a time, we got this",
  "tiny ghost believes in this session",
  "you code, i haunt productively",
];

export const WELCOME_BACK_LINES = [
  "welcome back bestie. i missed your little productive aura ✨",
  "hi again 👻 ready to do one tiny thing?",
  "there you are. we can ease back in gently 💜",
  "welcome back. no pressure, just vibes and small progress ✨",
];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getContextualDialogue({
  mood,
  energy,
  action,
}: ContextualDialogueParams): string {
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
    "hydration check 💧",
    "unclench your jaw for me",
    "shoulders down. we are not fighting the code",
    "blink. i am watching.",
    "drink water or i will haunt you gently",
    "posture check. tiny adjustment.",
    "you deserve breaks, not just results",
    "rest is part of the process",
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

export function getFocusAwareDialogue({
  mood,
  energy,
  todayMinutes,
  streak,
}: FocusAwareDialogueParams): string {
  if (energy < 25) {
    return random([
      "we can go slow. tired brains still count 💜",
      "low energy mode… we’ll take this gently",
      "maybe a small task… no pressure",
    ]);
  }

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

  if (todayMinutes === 0) {
    return random([
      "we can start small. one task is enough 💫",
      "no pressure. just begin.",
      "i’ll stay with you while you start ✨",
    ]);
  }

  if (mood > 80) {
    return random([
      "this focus session has really good energy ✨",
      "we are so in our productive little era",
    ]);
  }

  return random(FOCUS_DIALOGUE);
}

export function getStatsAwareDialogue({
  topLabel,
  completionRate,
  todaySessions,
  streak,
  todayMinutes,
}: StatsAwareDialogueParams): string | null {
  const lines: string[] = [];

  if (todaySessions >= 4) {
    lines.push("you’ve been really steady today. i’m very proud of you 💜");
  } else if (todaySessions >= 2) {
    lines.push(
      "you’ve already gotten a couple of focus sessions in today. look at you go ✨"
    );
  }

  if (todayMinutes >= 90) {
    lines.push("you’ve spent a lot of real time focusing today. that matters 👻");
  } else if (todayMinutes >= 45) {
    lines.push("you’ve built some really nice momentum today ✨");
  }

  if (completionRate >= 85) {
    lines.push("you’ve been finishing what you start lately. that’s huge 💖");
  } else if (completionRate >= 65) {
    lines.push("you’ve been doing a really solid job sticking with things lately 💫");
  }

  if (streak >= 7) {
    lines.push(`a ${streak}-day streak is kind of iconic, actually ✨`);
  } else if (streak >= 3) {
    lines.push(`you’re on a ${streak}-day streak right now. steady little legend 👻`);
  }

  if (topLabel && topLabel !== "Unlabeled") {
    lines.push(`you and i have been spending a lot of time on ${topLabel} lately 👻`);
  }

  if (lines.length === 0) {
    return null;
  }

  return random(lines);
}

export function getWelcomeBackDialogue() {
  return random(WELCOME_BACK_LINES);
}

export function getFocusCompleteDialogue(taskLabel?: string) {
  const taskText = taskLabel?.trim();

  const genericLines = [
    "focus session complete. look at you go, little legend ✨",
    "you finished your focus session. i’m proud of you 💖",
    "another little win in the books 👻",
    "you did it. tiny progress is still progress ✨",
  ];

  const taskLines = taskText
    ? [
        `you did it — ${taskText} is done for now. i’m so proud of you 💖`,
        `${taskText} got some real attention today. love that for us ✨`,
        `another little win for ${taskText}. we’re building something real 👻`,
        `${taskText} is officially more handled than it was before. iconic 💫`,
      ]
    : [];

  return random(taskText ? taskLines : genericLines);
}

export function getCancelledFocusDialogue(taskLabel?: string) {
  const taskText = taskLabel?.trim();

  if (taskText) {
    return random([
      `it’s okay — ${taskText} can wait. we can try again when you’re ready 💜`,
      `${taskText} is still there for later. no guilt spiral allowed 👻`,
      `we can come back to ${taskText} when the vibes are better ✨`,
    ]);
  }

  return random([
    "it’s okay. stopping early still counts as checking in with yourself 💜",
    "we can try again later. no dramatic ghost judgment here ✨",
    "a paused plan is still a plan. we can come back to it 👻",
  ]);
}