"use client";

import { useCallback, useState } from "react";
import { Mic2, Loader2 } from "lucide-react";

import AudioRecorder, { RecordedAudio } from "./AudioRecorder";
import TranslationResult from "./TranslationResult";
import VoiceSelector from "./VoiceSelector";
import {
  translateSpeech,
  SpeechTranslationResponse,
  TTS_VOICES,
  TtsVoice,
} from "@/lib/api";
import { LANGUAGES, MAX_RECORDING_SECONDS, TONE_OPTIONS } from "@/lib/options";

export default function VoiceTranslateCard() {
  const [sourceLanguage, setSourceLanguage] = useState("French");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [tone, setTone] = useState("neutral");
  const [voice, setVoice] = useState<TtsVoice>("coral");
  const [generateVoiceover, setGenerateVoiceover] = useState(true);
  const [recording, setRecording] = useState<RecordedAudio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpeechTranslationResponse | null>(null);

  const resetResult = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  const handleRecordingReady = useCallback((nextRecording: RecordedAudio) => {
    setRecording(nextRecording);
    setError(null);
    setResult(null);
  }, []);

  const handleTranslateSpeech = useCallback(async () => {
    if (!recording) {
      setError("Record some audio before translating.");
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setError("Source and target languages must be different.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await translateSpeech({
        audio: recording.blob,
        filename: recording.filename,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        tone,
        generate_voiceover: generateVoiceover,
        voice,
      });
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [
    generateVoiceover,
    recording,
    sourceLanguage,
    targetLanguage,
    tone,
    voice,
  ]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/70 transition-colors dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-950/40">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <Mic2 className="h-5 w-5 text-teal-600 dark:text-cyan-300" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Voice Translate Mode
          </span>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Source Language
              </label>
              <select
                value={sourceLanguage}
                onChange={(event) => {
                  setSourceLanguage(event.target.value);
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

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Target Language
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
                  onClick={() => setTone(value)}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
                onChange={(event) => setGenerateVoiceover(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900 dark:text-cyan-500"
              />
              Generate voiceover automatically
            </label>
          </div>

          <AudioRecorder
            maxDurationSeconds={MAX_RECORDING_SECONDS}
            disabled={loading}
            onRecordingStart={() => {
              setRecording(null);
              resetResult();
            }}
            onRecordingReady={handleRecordingReady}
            onError={(message) => setError(message)}
          />

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleTranslateSpeech}
            disabled={loading || !recording}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-cyan-800"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating Speech...
              </>
            ) : (
              "Translate Speech"
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
              ? "Voiceover is generated for the translated text after each voice translation. You can replay it without another API call during this session."
              : "Voiceover is optional. Click play only when you want audio for the translated text."
          }
        />
      )}
    </div>
  );
}
