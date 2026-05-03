import TranslatorCard from "@/components/TranslatorCard";
import { Globe2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 py-10 px-4">
      {/* Hero Header */}
      <header className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-2">
          <Globe2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
          Evans Language Translator
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Translate words, understand pronunciation, and speak with confidence.
        </p>
      </header>

      {/* Translator */}
      <TranslatorCard />

      {/* Footer */}
      <footer className="text-center mt-12 text-xs text-slate-400">
        Powered by OpenAI · Built with Next.js &amp; FastAPI
      </footer>
    </main>
  );
}
