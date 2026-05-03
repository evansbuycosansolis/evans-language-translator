export const LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "Tagalog",
  "Hiligaynon",
  "Cebuano",
] as const;

export const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "formal", label: "Formal" },
  { value: "informal", label: "Informal" },
] as const;

export const MAX_RECORDING_SECONDS = 30;

export type SupportedLanguage = (typeof LANGUAGES)[number];
export type ToneValue = (typeof TONE_OPTIONS)[number]["value"];
