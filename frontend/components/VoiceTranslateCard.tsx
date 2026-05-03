"use client";

import { useCallback, useState } from "react";
import { Loader2, Mic2 } from "lucide-react";

import LiveSpeechInput from "./LiveSpeechInput";
import TranslationResult from "./TranslationResult";
import VoiceSelector from "./VoiceSelector";
import {
  translateText,
  TTS_VOICES,
} from "@/lib/api";
import type { TranslationDisplayResult, TtsVoice } from "@/lib/api";
import {
  LANGUAGES,
  LIVE_SPEECH_LANGUAGES,
  TONE_OPTIONS,
  getLiveSpeechLanguageOption,
} from "@/lib/options";
import type { LiveSpeechLocale } from "@/lib/options";

export default function VoiceTranslateCard() {
  const [recognitionLanguageCode, setRecognitionLanguageCode] =
    useState<LiveSpeechLocale>("fr-FR");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [tone, setTone] = useState("neutral");
  const [voice, setVoice] = useState<TtsVoice>("coral");
  const [generateVoiceover, setGenerateVoiceover] = useState(true);
  const [autoTranslateAfterStop, setAutoTranslateAfterStop] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationDisplayResult | null>(null);

  const resetResult = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  const handleTranscriptChange = useCallback(
    (nextTranscript: string) => {
      setTranscript(nextTranscript);
      resetResult();
    },
    [resetResult]
  );

  const handleTranslate = useCallback(
    async (overrideTranscript?: string) => {
      const textToTranslate = (overrideTranscript ?? transcript).trim();

      if (!textToTranslate) {
        setError("Speak or type some text before translating.");
        return;
      }

      const selectedRecognitionLanguage = getLiveSpeechLanguageOption(
        recognitionLanguageCode
      );
      const sourceLanguage = selectedRecognitionLanguage.sourceLanguage;

      if (sourceLanguage === targetLanguage) {
        setError("Choose a different target language to translate the live transcript.");
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await translateText({
          text: textToTranslate,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          tone,
        });

        setTranscript(textToTranslate);
        setResult({
          source_language: response.source_language,
          target_language: response.target_language,
          translation: response.translation,
          ipa: response.ipa,
          simple_pronunciation: response.simple_pronunciation,
          notes: response.notes,
          transcript: textToTranslate,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    },
    [recognitionLanguageCode, targetLanguage, tone, transcript]
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/70 transition-colors dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-950/40">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <Mic2 className="h-5 w-5 text-teal-600 dark:text-cyan-300" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Live Voice Dictation
          </span>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
            Live dictation stays in your browser through the Web Speech API.
            Only the final text is sent to the backend when you click
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {" "}
              Translate
            </span>
            .
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Source Speech Language
              </label>
              <select
                value={recognitionLanguageCode}
                onChange={(event) => {
                  setRecognitionLanguageCode(
                    event.target.value as LiveSpeechLocale
                  );
                  resetResult();
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400"
              >
                {LIVE_SPEECH_LANGUAGES.map((language) => (
                  <option key={language.locale} value={language.locale}>
                    {language.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Target Translation Language
              </label>
              <select
                value={targetLanguage}
                onChange={(event) => {
                  setTargetLanguage(event.target.value);
                  resetResult();
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400"
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
                    resetResult();
                  }}
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

          <div className="grid grid-cols-1 gap-3">
            <VoiceSelector
              value={voice}
              voices={[...TTS_VOICES]}
              onChange={(nextVoice) => setVoice(nextVoice as TtsVoice)}
              disabled={loading}
            />

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <input
                type="checkbox"
                checked={generateVoiceover}
                onChange={(event) =>
                  setGenerateVoiceover(event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-cyan-500"
              />
              Generate voiceover automatically
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
              <input
                type="checkbox"
                checked={autoTranslateAfterStop}
                onChange={(event) =>
                  setAutoTranslateAfterStop(event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-cyan-500"
              />
              Auto-translate after I stop speaking
            </label>
          </div>

          <LiveSpeechInput
            value={transcript}
            recognitionLanguageCode={recognitionLanguageCode}
            disabled={loading}
            autoTranslateAfterStop={autoTranslateAfterStop}
            onChange={handleTranscriptChange}
            onListeningChange={setIsListening}
            onAutoTranslate={(finalText) => {
              void handleTranslate(finalText);
            }}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              void handleTranslate();
            }}
            disabled={loading || isListening || !transcript.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-cyan-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating Speech...
              </>
            ) : (
              "Translate"
            )}
          </button>
        </div>
      </div>

      {result && (
        <TranslationResult
          result={result}
          preferredVoice={voice}
          autoGenerateVoiceover={generateVoiceover}
          audioButtonLabel="Play Voiceover"
          audioCaption={
            generateVoiceover
              ? "Voiceover is generated for the translated text after each live dictation result. You can replay it without another API call during this session."
              : "Voiceover stays optional. Click play only when you want audio for the translated text."
          }
        />
      )}
    </div>
  );
}
