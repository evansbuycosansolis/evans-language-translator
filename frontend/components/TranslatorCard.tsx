"use client";

import { useState, useCallback } from "react";
import { translateText, TranslationResponse } from "@/lib/api";
import TranslationResult from "./TranslationResult";
import { Languages, ArrowRightLeft, Loader2 } from "lucide-react";

const LANGUAGES = [
  "English",
  "French",
  "Spanish",
  "Tagalog",
  "Hiligaynon",
  "Cebuano",
];

const TONES = [
  { value: "neutral", label: "Neutral" },
  { value: "formal", label: "Formal" },
  { value: "informal", label: "Informal" },
];

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
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 flex items-center gap-2">
          <Languages className="w-5 h-5 text-indigo-500" />
          <span className="font-semibold text-slate-700 text-sm">
            Translation Settings
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Language & Tone row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            {/* Source Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                From
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => {
                  setSourceLanguage(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
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
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 transition shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Target Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
                To
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => {
                  setTargetLanguage(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
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
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Tone
            </label>
            <div className="flex gap-2 flex-wrap">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTone(value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                    tone === value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Text input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">
              Text to Translate
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text here…"
              rows={4}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none transition"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 transition shadow-sm text-sm"
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
