export const LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "Tagalog",
  "Hiligaynon",
  "Cebuano",
] as const;

export const LIVE_SPEECH_LANGUAGES = [
  {
    label: "English",
    locale: "en-US",
    displayName: "English - en-US",
    sourceLanguage: "English",
  },
  {
    label: "French",
    locale: "fr-FR",
    displayName: "French - fr-FR",
    sourceLanguage: "French",
  },
  {
    label: "Spanish",
    locale: "es-ES",
    displayName: "Spanish - es-ES",
    sourceLanguage: "Spanish",
  },
] as const;

export const TONE_OPTIONS = [
  { value: "neutral", label: "Neutral" },
  { value: "formal", label: "Formal" },
  { value: "informal", label: "Informal" },
] as const;

export const MAX_RECORDING_SECONDS = 30;

export type SupportedLanguage = (typeof LANGUAGES)[number];
export type LiveSpeechLocale = (typeof LIVE_SPEECH_LANGUAGES)[number]["locale"];
export type ToneValue = (typeof TONE_OPTIONS)[number]["value"];

export function getLiveSpeechLanguageOption(locale: LiveSpeechLocale) {
  return (
    LIVE_SPEECH_LANGUAGES.find((option) => option.locale === locale) ??
    LIVE_SPEECH_LANGUAGES[0]
  );
}
