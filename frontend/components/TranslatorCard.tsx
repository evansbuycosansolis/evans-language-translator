"use client";

import { useState, useCallback } from "react";
import { translateText, TranslationResponse } from "@/lib/api";
import { LANGUAGES, TONE_OPTIONS } from "@/lib/options";
import TranslationResult from "./TranslationResult";
import { Languages, ArrowRightLeft, Loader2 } from "lucide-react";

export default function TranslatorCard() {
  const [text, setText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("French");
  const [tone, setTone] = useState("neutral");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResponse | null>(null);

  const swapLanguages = useCallback(() => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setResult(null);
  }, [sourceLanguage, targetLanguage]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim()) {
        setError("Please enter some text to translate.");
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
        const response = await translateText({
          text,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          tone,
        });
        setResult(response);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    },
    [text, sourceLanguage, targetLanguage, tone]
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Translation Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/70 transition-colors dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-slate-950/40">
        {/* Card Header */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <Languages className="w-5 h-5 text-indigo-500 dark:text-cyan-300" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
            Translation Settings
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Language & Tone row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            {/* Source Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                From
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => {
                  setSourceLanguage(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={swapLanguages}
                title="Swap languages"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:bg-slate-800 dark:hover:text-cyan-200"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Target Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                To
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => {
                  setTargetLanguage(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-400"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tone
            </label>
            <div className="flex gap-2 flex-wrap">
              {TONE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTone(value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    tone === value
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-cyan-500 dark:bg-cyan-500 dark:text-slate-950"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Text to Translate
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text here…"
              rows={4}
              required
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-indigo-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-cyan-800"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Translating…
              </>
            ) : (
              "Translate"
            )}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && <TranslationResult result={result} />}
    </div>
  );
}
