"use client";

import { useState, useCallback } from "react";
import { TranslationResponse } from "@/lib/api";
import { Copy, CheckCheck, BookOpen, Mic, MessageSquare } from "lucide-react";

interface Props {
  result: TranslationResponse;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
    >
      {copied ? (
        <CheckCheck className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

interface ResultRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

function ResultRow({ icon, label, value, mono }: ResultRowProps) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {icon}
          {label}
        </span>
        <CopyButton text={value} />
      </div>
      <p
        className={`text-slate-800 text-base leading-relaxed ${
          mono ? "font-mono text-sm" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function TranslationResult({ result }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {result.source_language} → {result.target_language}
        </p>
      </div>

      <div className="p-6 space-y-3">
        {/* Translation */}
        <ResultRow
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          label="Translation"
          value={result.translation}
        />

        {/* IPA */}
        <ResultRow
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="IPA Transcription"
          value={result.ipa}
          mono
        />

        {/* Simple Pronunciation */}
        <ResultRow
          icon={<Mic className="w-3.5 h-3.5" />}
          label="Pronunciation Guide"
          value={result.simple_pronunciation}
        />

        {/* Notes */}
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 space-y-1">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Grammar &amp; Usage Notes
          </span>
          <p className="text-slate-700 text-sm leading-relaxed">{result.notes}</p>
        </div>
      </div>
    </div>
  );
}
