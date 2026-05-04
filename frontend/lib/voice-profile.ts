import type { LiveSpeechLocale, SupportedLanguage } from "./options";

export interface VoiceProfile {
  preferredSourceLanguage: SupportedLanguage;
  accentOrRegion: string;
  commonNames: string;
  commonPhrases: string;
  calibrationPhrase: string;
}

export const VOICE_PROFILE_STORAGE_KEY =
  "evans-language-translator.voice-profile";

export const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  preferredSourceLanguage: "English",
  accentOrRegion: "",
  commonNames: "",
  commonPhrases: "",
  calibrationPhrase: "",
};

export function buildVoiceProfileContext(profile: VoiceProfile): string | null {
  const parts = [
    `Preferred language: ${profile.preferredSourceLanguage}.`,
    profile.accentOrRegion.trim()
      ? `Accent or region notes: ${profile.accentOrRegion.trim()}.`
      : "",
    profile.commonNames.trim()
      ? `Common names or people mentioned often: ${profile.commonNames.trim()}.`
      : "",
    profile.commonPhrases.trim()
      ? `Recurring phrases, jargon, or vocabulary: ${profile.commonPhrases.trim()}.`
      : "",
    profile.calibrationPhrase.trim()
      ? `Sample of the speaker's natural phrasing: ${profile.calibrationPhrase.trim()}.`
      : "",
  ].filter(Boolean);

  const context = parts.join(" ").trim();
  return context || null;
}

export function getLiveSpeechLocaleForLanguage(
  language: SupportedLanguage
): LiveSpeechLocale | null {
  switch (language) {
    case "English":
      return "en-US";
    case "French":
      return "fr-FR";
    case "Spanish":
      return "es-ES";
    default:
      return null;
  }
}

