"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AudioLines, Languages, Loader2, Mic, Radio } from "lucide-react";

import {
  TTS_VOICES,
  translateSpeech,
  translateText,
  type TranslationDisplayResult,
  type TranslationResponse,
  type TtsVoice,
} from "@/lib/api";
import {
  LANGUAGES,
  LIVE_SPEECH_LANGUAGES,
  MAX_RECORDING_SECONDS,
  TONE_OPTIONS,
  getLiveSpeechLanguageOption,
  type LiveSpeechLocale,
  type SupportedLanguage,
  type ToneValue,
} from "@/lib/options";
import {
  buildVoiceProfileContext,
  DEFAULT_VOICE_PROFILE,
  getLiveSpeechLocaleForLanguage,
  VOICE_PROFILE_STORAGE_KEY,
  type VoiceProfile,
} from "@/lib/voice-profile";

import AudioRecorder, { type RecordedAudio } from "./AudioRecorder";
import LiveSpeechInput from "./LiveSpeechInput";
import TranslationResult from "./TranslationResult";
import VoiceProfileCard from "./VoiceProfileCard";
import VoiceSelector from "./VoiceSelector";

type VoiceInputMode = "live" | "accurate";

function mapTranslationResult(
  response: TranslationResponse,
  transcript?: string
): TranslationDisplayResult {
  return {
    source_language: response.source_language,
    target_language: response.target_language,
    translation: response.translation,
    ipa: response.ipa,
    simple_pronunciation: response.simple_pronunciation,
    notes: response.notes,
    transcript,
  };
}

function normalizeStoredProfile(candidate: unknown): VoiceProfile | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const rawProfile = candidate as Partial<Record<keyof VoiceProfile, unknown>>;
  const preferredSourceLanguage =
    typeof rawProfile.preferredSourceLanguage === "string" &&
    LANGUAGES.includes(rawProfile.preferredSourceLanguage as SupportedLanguage)
      ? (rawProfile.preferredSourceLanguage as SupportedLanguage)
      : DEFAULT_VOICE_PROFILE.preferredSourceLanguage;

  return {
    preferredSourceLanguage,
    accentOrRegion:
      typeof rawProfile.accentOrRegion === "string"
        ? rawProfile.accentOrRegion
        : "",
    commonNames:
      typeof rawProfile.commonNames === "string" ? rawProfile.commonNames : "",
    commonPhrases:
      typeof rawProfile.commonPhrases === "string"
        ? rawProfile.commonPhrases
        : "",
    calibrationPhrase:
      typeof rawProfile.calibrationPhrase === "string"
        ? rawProfile.calibrationPhrase
        : "",
  };
}

export default function VoiceTranslateCard() {
  const [voiceInputMode, setVoiceInputMode] = useState<VoiceInputMode>("live");
  const [liveRecognitionLanguageCode, setLiveRecognitionLanguageCode] =
    useState<LiveSpeechLocale>("en-US");
  const [accurateSourceLanguage, setAccurateSourceLanguage] =
    useState<SupportedLanguage>("English");
  const [targetLanguage, setTargetLanguage] =
    useState<SupportedLanguage>("French");
  const [tone, setTone] = useState<ToneValue>("neutral");
  const [voice, setVoice] = useState<TtsVoice>("coral");
  const [generateVoiceover, setGenerateVoiceover] = useState(true);
  const [autoTranslateAfterStop, setAutoTranslateAfterStop] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [accurateRecording, setAccurateRecording] =
    useState<RecordedAudio | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationDisplayResult | null>(null);
  const [profile, setProfile] = useState<VoiceProfile>(DEFAULT_VOICE_PROFILE);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  const liveSourceOption = useMemo(
    () => getLiveSpeechLanguageOption(liveRecognitionLanguageCode),
    [liveRecognitionLanguageCode]
  );
  const liveSourceLanguage = liveSourceOption.sourceLanguage as SupportedLanguage;
  const profileContext = useMemo(
    () => buildVoiceProfileContext(profile),
    [profile]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(
        VOICE_PROFILE_STORAGE_KEY
      );
      if (!storedValue) {
        return;
      }

      const parsedProfile = normalizeStoredProfile(JSON.parse(storedValue));
      if (!parsedProfile) {
        return;
      }

      setProfile(parsedProfile);
      setAccurateSourceLanguage(parsedProfile.preferredSourceLanguage);

      const liveLocale = getLiveSpeechLocaleForLanguage(
        parsedProfile.preferredSourceLanguage
      );
      if (liveLocale) {
        setLiveRecognitionLanguageCode(liveLocale);
      }
    } catch {
      // Ignore invalid local profile data and continue with defaults.
    }
  }, []);

  const resetTranslationState = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  const validateLanguagePair = useCallback(
    (sourceLanguage: SupportedLanguage) => {
      if (sourceLanguage === targetLanguage) {
        setError("Source and target languages must be different.");
        return false;
      }

      return true;
    },
    [targetLanguage]
  );

  const handleLiveTranslate = useCallback(
    async (overrideText?: string) => {
      const transcript = (overrideText ?? liveTranscript).trim();
      if (!transcript) {
        setError("Speak or type something before translating.");
        return;
      }

      if (!validateLanguagePair(liveSourceLanguage)) {
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await translateText({
          text: transcript,
          source_language: liveSourceLanguage,
          target_language: targetLanguage,
          tone,
        });
        setResult(mapTranslationResult(response, transcript));
      } catch (translationError) {
        setError(
          translationError instanceof Error
            ? translationError.message
            : "Could not translate the live transcript."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      liveSourceLanguage,
      liveTranscript,
      targetLanguage,
      tone,
      validateLanguagePair,
    ]
  );

  const handleAccurateTranslate = useCallback(async () => {
    if (!accurateRecording) {
      setError("Record a short audio sample before using High Accuracy Dictation.");
      return;
    }

    if (!validateLanguagePair(accurateSourceLanguage)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await translateSpeech({
        audio: accurateRecording.blob,
        filename: accurateRecording.filename,
        source_language: accurateSourceLanguage,
        target_language: targetLanguage,
        tone,
        generate_voiceover: false,
        voice,
        profile_context: profileContext ?? undefined,
      });
      setResult(response);
    } catch (translationError) {
      setError(
        translationError instanceof Error
          ? translationError.message
          : "Could not transcribe and translate the recorded audio."
      );
    } finally {
      setLoading(false);
    }
  }, [
    accurateRecording,
    accurateSourceLanguage,
    profileContext,
    targetLanguage,
    tone,
    validateLanguagePair,
    voice,
  ]);

  const handleSaveProfile = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        VOICE_PROFILE_STORAGE_KEY,
        JSON.stringify(profile)
      );

      setAccurateSourceLanguage(profile.preferredSourceLanguage);
      const liveLocale = getLiveSpeechLocaleForLanguage(
        profile.preferredSourceLanguage
      );

      if (liveLocale) {
        setLiveRecognitionLanguageCode(liveLocale);
        setProfileStatus(
          "Profile saved on this device. Live dictation and High Accuracy Dictation will use your updated preferences."
        );
      } else {
        setProfileStatus(
          "Profile saved on this device. High Accuracy Dictation can use this language even when live browser dictation cannot."
        );
      }
    } catch {
      setProfileStatus(
        "The profile could not be saved in this browser. Please check your browser storage settings."
      );
    }
  }, [profile]);

  const handleResetProfile = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(VOICE_PROFILE_STORAGE_KEY);
    }

    setProfile(DEFAULT_VOICE_PROFILE);
    setAccurateSourceLanguage(DEFAULT_VOICE_PROFILE.preferredSourceLanguage);
    setLiveRecognitionLanguageCode("en-US");
    setProfileStatus("Voice profile reset on this device.");
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (voiceInputMode === "live") {
        await handleLiveTranslate();
        return;
      }

      await handleAccurateTranslate();
    },
    [handleAccurateTranslate, handleLiveTranslate, voiceInputMode]
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/70 transition-colors dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-950/40">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <Mic className="h-5 w-5 text-teal-600 dark:text-cyan-300" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Voice Translation
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-300">
            <p>
              Choose between quick live browser dictation and a stronger
              high-accuracy recording flow that sends one finished clip to the
              backend transcription model. Your saved voice profile stays in
              this browser and helps High Accuracy Dictation recognize names,
              accent notes, and recurring phrases more reliably.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Voice Mode
            </div>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setVoiceInputMode("live");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  voiceInputMode === "live"
                    ? "bg-teal-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950"
                    : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-200"
                }`}
              >
                <Radio className="h-4 w-4" />
                Live Browser Dictation
              </button>

              <button
                type="button"
                onClick={() => {
                  setVoiceInputMode("accurate");
                  setError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  voiceInputMode === "accurate"
                    ? "bg-indigo-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950"
                    : "bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-200"
                }`}
              >
                <AudioLines className="h-4 w-4" />
                High Accuracy Dictation
              </button>
            </div>
          </div>

          <VoiceProfileCard
            profile={profile}
            statusMessage={profileStatus}
            disabled={loading || isListening}
            onChange={(nextProfile) => {
              setProfile(nextProfile);
              setProfileStatus(null);
            }}
            onSave={handleSaveProfile}
            onReset={handleResetProfile}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {voiceInputMode === "live"
                  ? "Source Speech Language"
                  : "Source Language"}
              </label>
              {voiceInputMode === "live" ? (
                <select
                  value={liveRecognitionLanguageCode}
                  onChange={(event) => {
                    setLiveRecognitionLanguageCode(
                      event.target.value as LiveSpeechLocale
                    );
                    resetTranslationState();
                  }}
                  disabled={loading || isListening}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                >
                  {LIVE_SPEECH_LANGUAGES.map((language) => (
                    <option key={language.locale} value={language.locale}>
                      {language.displayName}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={accurateSourceLanguage}
                  onChange={(event) => {
                    setAccurateSourceLanguage(
                      event.target.value as SupportedLanguage
                    );
                    resetTranslationState();
                  }}
                  disabled={loading || isListening}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
                >
                  {LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Target Translation Language
              </label>
              <select
                value={targetLanguage}
                onChange={(event) => {
                  setTargetLanguage(event.target.value as SupportedLanguage);
                  resetTranslationState();
                }}
                disabled={loading || isListening}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-500"
              >
                {LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTone(value);
                    resetTranslationState();
                  }}
                  disabled={loading}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    tone === value
                      ? "border-teal-600 bg-teal-600 text-white shadow-sm dark:border-cyan-500 dark:bg-cyan-500 dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Voice
            </label>
            <VoiceSelector
              value={voice}
              voices={[...TTS_VOICES]}
              onChange={(nextVoice) => setVoice(nextVoice as TtsVoice)}
              disabled={loading}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <input
                type="checkbox"
                checked={generateVoiceover}
                onChange={(event) =>
                  setGenerateVoiceover(event.target.checked)
                }
                disabled={loading}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-cyan-400 dark:focus:ring-cyan-400"
              />
              Generate voiceover automatically after translation
            </label>

            {voiceInputMode === "live" && (
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={autoTranslateAfterStop}
                  onChange={(event) =>
                    setAutoTranslateAfterStop(event.target.checked)
                  }
                  disabled={loading}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-cyan-400 dark:focus:ring-cyan-400"
                />
                Auto-translate after I stop speaking
              </label>
            )}
          </div>

          {voiceInputMode === "live" ? (
            <LiveSpeechInput
              value={liveTranscript}
              recognitionLanguageCode={liveRecognitionLanguageCode}
              disabled={loading}
              autoTranslateAfterStop={autoTranslateAfterStop}
              onListeningChange={setIsListening}
              onChange={(value) => {
                setLiveTranscript(value);
                setError(null);
                setResult(null);
              }}
              onAutoTranslate={(finalText) => {
                void handleLiveTranslate(finalText);
              }}
            />
          ) : (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/80">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <p>
                  High Accuracy Dictation records first, then uploads one audio
                  clip to the backend transcription model. That path can use
                  your saved voice profile to improve names, accent hints, and
                  recurring vocabulary.
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Profile context:{" "}
                  {profileContext
                    ? "ready to assist recognition for this recording"
                    : "add optional notes in My Voice Profile for extra context"}
                </p>
              </div>

              <AudioRecorder
                maxDurationSeconds={MAX_RECORDING_SECONDS}
                disabled={loading}
                onRecordingStart={() => {
                  setAccurateRecording(null);
                  setError(null);
                  setResult(null);
                }}
                onRecordingReady={(recording) => {
                  setAccurateRecording(recording);
                  setError(null);
                  setResult(null);
                }}
                onError={(message) => setError(message)}
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              isListening ||
              (voiceInputMode === "live"
                ? !liveTranscript.trim()
                : !accurateRecording)
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-cyan-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {voiceInputMode === "live"
                  ? "Translating..."
                  : "Transcribing & Translating..."}
              </>
            ) : voiceInputMode === "live" ? (
              <>
                <Languages className="h-4 w-4" />
                Translate
              </>
            ) : (
              <>
                <AudioLines className="h-4 w-4" />
                Transcribe & Translate
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <TranslationResult
          result={result}
          preferredVoice={voice}
          autoGenerateVoiceover={generateVoiceover}
          audioButtonLabel="Play Voiceover"
          audioCaption="Audio is generated only when needed. Automatic voiceover uses the selected voice once a translation result is ready."
        />
      )}
    </div>
  );
}
