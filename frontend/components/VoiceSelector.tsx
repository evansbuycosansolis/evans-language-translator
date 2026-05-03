interface VoiceSelectorProps {
  value: string;
  voices: string[];
  onChange: (voice: string) => void;
  disabled?: boolean;
}

export default function VoiceSelector({
  value,
  voices,
  onChange,
  disabled = false,
}: VoiceSelectorProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Voice
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-w-32 bg-transparent text-sm font-medium text-slate-700 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-100 dark:disabled:text-slate-500"
      >
        {voices.map((voice) => (
          <option key={voice} value={voice}>
            {voice}
          </option>
        ))}
      </select>
    </label>
  );
}
