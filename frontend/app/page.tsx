"use client";

import { useState } from "react";

import TranslatorCard from "@/components/TranslatorCard";
import ThemeToggle from "@/components/ThemeToggle";
import VoiceTranslateCard from "@/components/VoiceTranslateCard";
import { Globe2, Languages, Mic2 } from "lucide-react";

type TranslationMode = "text" | "voice";

export default function Home() {
  const [mode, setMode] = useState<TranslationMode>("text");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(135deg,_#f8fafc,_#eef2ff_45%,_#fdf2f8)] px-4 py-10 transition-colors dark:bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.22),_transparent_24%),linear-gradient(160deg,_#020617,_#0f172a_48%,_#111827)]">
      <div className="mx-auto mb-6 flex w-full max-w-5xl justify-end">
        <ThemeToggle />
      </div>

      {/* Hero Header */}
      <header className="text-center mb-10 space-y-3">
        <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25 dark:bg-cyan-500 dark:shadow-cyan-500/25">
          <Globe2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Evans Language Translator
        </h1>
        <p className="mx-auto max-w-xl text-lg text-slate-500 dark:text-slate-300">
          Translate words, understand pronunciation, and speak with confidence.
        </p>
      </header>

      <section className="mx-auto mb-8 w-full max-w-2xl rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/65">
        <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Mode
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === "text"
                ? "bg-indigo-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950"
                : "bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-200"
            }`}
          >
            <Languages className="h-4 w-4" />
            Text Translate
          </button>

          <button
            type="button"
            onClick={() => setMode("voice")}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === "voice"
                ? "bg-teal-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950"
                : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-200"
            }`}
          >
            <Mic2 className="h-4 w-4" />
            Voice Translate
          </button>
        </div>
      </section>

      {/* Translator */}
      {mode === "text" ? <TranslatorCard /> : <VoiceTranslateCard />}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400 dark:text-slate-500">
        Powered by OpenAI · Built with Next.js &amp; FastAPI
      </footer>
    </main>
  );
}
