export type PetType = "ghost";

export type InteractionType = "pet" | "feed" | "play";

export type Pet = {
  id: string;
  name: string;
  type: PetType;
  happiness: number;
  energy: number;
  visits: number;
  lastUpdated: string;
  lastInteraction?: InteractionType;
  currentDialogue: string;
};