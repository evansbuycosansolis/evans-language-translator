"use client";

import { RotateCcw, Save, UserRound } from "lucide-react";

import { LANGUAGES } from "@/lib/options";
import type { VoiceProfile } from "@/lib/voice-profile";

interface VoiceProfileCardProps {
  profile: VoiceProfile;
  disabled?: boolean;
  statusMessage?: string | null;
  onChange: (profile: VoiceProfile) => void;
  onSave: () => void;
  onReset: () => void;
}

export default function VoiceProfileCard({
  profile,
  disabled = false,
  statusMessage = null,
  onChange,
  onSave,
  onReset,
}: VoiceProfileCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/80">
      <div className="flex items-center gap-2">
        <UserRound className="h-4 w-4 text-indigo-600 dark:text-cyan-300" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            My Voice Profile
          </p>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Save names, phrases, and accent notes in this browser so High
            Accuracy Dictation can send stronger context to the backend
            transcription model.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Preferred Speech Language
          </label>
          <select
            value={profile.preferredSourceLanguage}
            onChange={(event) =>
              onChange({
                ...profile,
                preferredSourceLanguage: event.target.value as VoiceProfile["preferredSourceLanguage"],
              })
            }
            disabled={disabled}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500"
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
            Accent Or Region
          </label>
          <input
            type="text"
            value={profile.accentOrRegion}
            onChange={(event) =>
              onChange({
                ...profile,
                accentOrRegion: event.target.value,
              })
            }
            disabled={disabled}
            placeholder="Example: Filipino English, Quebec French"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Common Names
        </label>
        <textarea
          value={profile.commonNames}
          onChange={(event) =>
            onChange({
              ...profile,
              commonNames: event.target.value,
            })
          }
          disabled={disabled}
          rows={2}
          placeholder="Example: Evans, Marie, Jean-Claude, Solis"
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Common Phrases Or Vocabulary
        </label>
        <textarea
          value={profile.commonPhrases}
          onChange={(event) =>
            onChange({
              ...profile,
              commonPhrases: event.target.value,
            })
          }
          disabled={disabled}
          rows={3}
          placeholder="Example: blood pressure, how are you, bonjour, merci, prescription"
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Calibration Phrase
        </label>
        <textarea
          value={profile.calibrationPhrase}
          onChange={(event) =>
            onChange({
              ...profile,
              calibrationPhrase: event.target.value,
            })
          }
          disabled={disabled}
          rows={2}
          placeholder="Write one sentence that sounds like your everyday speech."
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-400 dark:disabled:bg-slate-900/60 dark:disabled:text-slate-500"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:disabled:bg-cyan-800"
          >
            <Save className="h-4 w-4" />
            Save Profile
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:text-white dark:disabled:border-slate-800 dark:disabled:text-slate-500"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        {statusMessage && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
}

