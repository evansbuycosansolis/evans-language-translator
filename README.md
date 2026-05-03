# Evans Language Translator

> AI-powered language translator with IPA phonetic transcription and pronunciation guidance.

---

## Overview

**Evans Language Translator** is a full-stack web application that lets users translate text between languages and receive:

- ✅ Translated text
- 🔤 IPA phonetic transcription (dictionary-style)
- 🗣️ Simple pronunciation guide for non-linguists
- 📝 Short grammar / usage notes

The **Next.js** frontend talks to a **FastAPI** backend, which securely calls the **OpenAI API**.  
The API key is **never** exposed to the browser.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS    |
| Backend  | FastAPI, Python 3.11+, Uvicorn          |
| AI       | OpenAI API (`gpt-4o-mini` by default)   |

---

## Project Structure

```
evans-language-translator/
├── backend/
│   ├── main.py                          # FastAPI app entry point
│   ├── config.py                        # Environment variable loading
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   └── translation_routes.py        # POST /api/translate
│   ├── services/
│   │   ├── openai_translation_service.py
│   │   └── phonetic_service.py          # Stub for future IPA engine
│   └── models/
│       └── translation_models.py        # Pydantic request/response models
│
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx                     # Landing page
│   ├── components/
│   │   ├── TranslatorCard.tsx           # Form / controls
│   │   └── TranslationResult.tsx        # Results display
│   └── lib/
│       └── api.ts                       # Typed fetch wrapper
│
└── README.md
```

---

## Prerequisites

- **Python 3.11+** and `pip`
- **Node.js 18+** and `npm`
- An **OpenAI API key** — get one at <https://platform.openai.com>

---

## Setup — Backend

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Open .env and set OPENAI_API_KEY=sk-...

# 4. Run the development server
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at `http://127.0.0.1:8000`.  
Interactive docs: `http://127.0.0.1:8000/docs`

---

## Setup — Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
# Default value points to http://127.0.0.1:8000 — no change needed for local dev

# 3. Run the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Adding Your OpenAI API Key

1. Open `backend/.env`
2. Set `OPENAI_API_KEY=sk-<your-key-here>`
3. Restart the backend server

> ⚠️ **Never** commit the `.env` file.  It is listed in `.gitignore`.

---

## API Reference

### `POST /api/translate`

**Request body:**
```json
{
  "text": "You must take this medication.",
  "source_language": "English",
  "target_language": "French",
  "tone": "formal"
}
```

| Field             | Type   | Required | Values                                           |
|-------------------|--------|----------|--------------------------------------------------|
| `text`            | string | ✅       | Any non-empty string                             |
| `source_language` | string | ✅       | English, French, Spanish, Tagalog, Hiligaynon, Cebuano |
| `target_language` | string | ✅       | Same list                                        |
| `tone`            | string | ❌       | `neutral` (default), `formal`, `informal`        |

**Response body:**
```json
{
  "original_text": "You must take this medication.",
  "source_language": "English",
  "target_language": "French",
  "translation": "Vous devez prendre ce médicament.",
  "ipa": "/vu dəve pʁɑ̃dʁ sə medikamɑ̃/",
  "simple_pronunciation": "Voo duh-VAY prahn-druh suh meh-dee-kah-MAHN",
  "notes": "In formal French, 'vous' is used instead of 'tu'."
}
```

**Error responses:**

| Status | Reason                                      |
|--------|---------------------------------------------|
| `422`  | Validation error (empty text, bad language) |
| `503`  | OpenAI API key missing / service unavailable|
| `502`  | Unexpected response format from OpenAI      |

### `GET /health`

Returns `{"status": "ok"}` — useful for uptime checks.

---

## Supported Languages

- English
- French
- Spanish
- Tagalog
- Hiligaynon
- Cebuano

---

## Future Improvements

- 🗄️ **Translation history** — store past translations in a PostgreSQL database
- ⚡ **Redis caching** — avoid duplicate OpenAI calls for identical requests
- 🔊 **Text-to-speech** — play audio pronunciation using a TTS API
- 📖 **Dictionary-based IPA** — integrate Epitran, eSpeak NG, or Wiktextract for more accurate IPA
- 👤 **User accounts** — save favourites and history per user
- 📄 **Document translation** — upload and translate PDF or Word documents
- 🌐 **More languages** — expand the supported language list
