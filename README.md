# Evans Language Translator

AI-powered translation with pronunciation guidance, live speech dictation, and optional text-to-speech playback.

## Overview

Evans Language Translator is a full-stack MVP that lets users:

- translate typed text
- dictate speech live in the browser with the Web Speech API
- edit the live transcript before sending it to the backend
- generate translations, IPA, pronunciation guidance, and usage notes
- optionally play translated voiceover audio

The frontend is built with Next.js and the backend uses FastAPI plus the OpenAI API. The OpenAI API key stays on the backend only and is never exposed to the browser.

## Features

- Text Translate mode for typed input
- Live Voice Dictation mode using the browser Web Speech API
- Translation tone selection: `neutral`, `formal`, `informal`
- IPA transcription and simple pronunciation guidance
- Grammar and usage notes
- On-demand text-to-speech playback
- Optional automatic voiceover after a translation result appears
- Optional auto-translate after dictation stops
- Dark mode toggle
- In-browser audio caching so replay does not re-call TTS during the current session

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11+, Uvicorn |
| AI | OpenAI API |
| Translation model | `gpt-4o-mini` |
| Speech-to-text model | `gpt-4o-mini-transcribe` |
| Text-to-speech model | `gpt-4o-mini-tts` |

## Project Structure

```text
evans-language-translator/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   ├── translation_models.py
│   │   ├── transcription_models.py
│   │   └── tts_models.py
│   ├── routes/
│   │   ├── translation_routes.py
│   │   ├── transcription_routes.py
│   │   ├── speech_translate_routes.py
│   │   └── tts_routes.py
│   └── services/
│       ├── openai_client.py
│       ├── openai_translation_service.py
│       ├── transcription_service.py
│       ├── text_to_speech_service.py
│       └── phonetic_service.py
├── frontend/
│   ├── .env.example
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── AudioRecorder.tsx
│   │   ├── LiveSpeechInput.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── TranslationResult.tsx
│   │   ├── TranslatorCard.tsx
│   │   ├── VoiceSelector.tsx
│   │   └── VoiceTranslateCard.tsx
│   └── lib/
│       ├── api.ts
│       └── options.ts
└── README.md
```

## Environment Variables

Backend `.env`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_TRANSLATION_MODEL=gpt-4o-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_MODEL=gpt-5.4-mini
MAX_TTS_TEXT_LENGTH=2000
MAX_AUDIO_FILE_SIZE_BYTES=26214400
MAX_RECORDING_SECONDS=30
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8010
```

## Setup

### Backend

Use a virtual environment. The backend imports use the `backend.` package path, so run Uvicorn from the repository root.

```powershell
cd C:\Users\ASUS\source\repos\evans-language-translator
python -m venv .venv
.venv\Scripts\activate
pip install -r backend\requirements.txt
copy backend\.env.example backend\.env
```

Add your OpenAI key to `backend/.env`, then start the backend:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8010
```

Backend URLs:

- API base: `http://127.0.0.1:8010`
- Health check: `http://127.0.0.1:8010/health`
- Docs: `http://127.0.0.1:8010/docs`

### Frontend

```powershell
cd C:\Users\ASUS\source\repos\evans-language-translator\frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend URL:

- `http://localhost:3000`

## Vercel Deployment

This repository now includes a root `vercel.json` using Vercel Services so the Next.js frontend and FastAPI backend deploy as one Vercel project.
It also includes a root `requirements.txt` that points to `backend/requirements.txt`, which helps Vercel's Python runtime install the backend dependencies during deployment.

Service layout:

- frontend: `frontend/` mounted at `/`
- backend: `backend/` mounted at `/backend`

The backend service also explicitly includes `backend/**` during deployment so
the FastAPI entrypoint in `backend/server.py` can import the package modules
correctly on Vercel.

In the Vercel dashboard:

1. Keep the project Root Directory as `./`.
2. Set the Framework Preset to `Services`.
3. Add this frontend environment variable:
   `NEXT_PUBLIC_API_BASE_URL=/backend`
4. Add your backend environment variables:
   `OPENAI_API_KEY`, `OPENAI_TRANSLATION_MODEL`, `OPENAI_TRANSCRIPTION_MODEL`, `OPENAI_TTS_MODEL`, and any other backend settings you need.

After deployment, your backend endpoints will live under the same domain, for example:

- `/backend/health`
- `/backend/api/translate`
- `/backend/api/text-to-speech`

## Live Speech-to-Text Translator

Live Voice Dictation uses the browser Web Speech API, not the backend, for real-time speech recognition.

- Works best in Chrome or Edge.
- No live audio is streamed to FastAPI or OpenAI.
- Only the final text is sent to the backend when the user clicks `Translate`.
- Translation and text-to-speech still require `OPENAI_API_KEY` on the backend.

### Supported Live Dictation Languages for MVP

- English: `en-US`
- French: `fr-FR`
- Spanish: `es-ES`

### Supported Translation Languages

- English
- French
- Spanish
- Tagalog
- Hiligaynon
- Cebuano

### Live Dictation Flow

1. Switch to `Live Voice Dictation`.
2. Click `Allow Microphone Access`.
3. Choose a microphone if multiple inputs are available.
4. Choose a source speech language and target translation language.
5. Click `Start Listening`.
6. Speak into the microphone and watch the text update live.
7. Click `Stop Listening`.
8. Edit the transcript if needed.
9. Click `Translate`.
10. Review the translation, IPA, pronunciation guide, and notes.
11. Click `Play Voiceover` if you want translated audio.

Optional behavior:

- Enable `Auto-translate after I stop speaking` to run one translation request after dictation ends.
- Enable `Generate voiceover automatically` to generate translated audio as soon as a translation result appears.
- Use the microphone dropdown to prefer a specific audio input when the browser supports track-based speech recognition startup.

## Text-to-Speech

The app uses the backend `POST /api/text-to-speech` endpoint to generate MP3 audio for translated text.

- The OpenAI API key stays on the backend.
- Audio is generated only when the user clicks play, or when automatic voiceover is enabled.
- Generated audio is cached in browser memory for the current session to avoid repeat API calls.

### Supported Voice Options

- `alloy`
- `ash`
- `ballad`
- `coral`
- `echo`
- `fable`
- `nova`
- `onyx`
- `sage`
- `shimmer`

## API Endpoints

### `POST /api/translate`

Translate text and return pronunciation guidance.

Request:

```json
{
  "text": "You must take this medication.",
  "source_language": "English",
  "target_language": "French",
  "tone": "formal"
}
```

Response:

```json
{
  "original_text": "You must take this medication.",
  "source_language": "English",
  "target_language": "French",
  "translation": "Vous devez prendre ce medicament.",
  "ipa": "/vu də.ve pʁɑ̃dʁ sə me.di.ka.mɑ̃/",
  "simple_pronunciation": "voo duh-vay prahn-druh suh may-dee-kah-mahn",
  "notes": "In formal French, 'vous' is appropriate."
}
```

### `POST /api/text-to-speech`

Generate MP3 audio for translated text.

Request:

```json
{
  "text": "Vous devez prendre ce medicament.",
  "language": "French",
  "voice": "coral"
}
```

Success response:

- `200 OK`
- content type: `audio/mpeg`

### `POST /api/transcribe`

Optional backend speech-to-text endpoint for recorded-audio workflows.

Request: `multipart/form-data`

- `file`: audio upload
- `source_language`: optional language hint

Response:

```json
{
  "transcript": "Vous devez prendre ce medicament.",
  "source_language": "French"
}
```

### `POST /api/speech-translate`

Optional backend recorded-audio translation endpoint.

Request: `multipart/form-data`

- `file`: audio upload
- `source_language`: selected source language
- `target_language`: selected target language
- `tone`: `neutral`, `formal`, or `informal`
- `generate_voiceover`: `true` or `false`
- `voice`: selected voice name

Response:

```json
{
  "source_language": "French",
  "target_language": "English",
  "transcript": "Vous devez prendre ce medicament.",
  "translation": "You must take this medication.",
  "ipa": "/ju mʌst teɪk ðɪs ˌmɛdɪˈkeɪʃən/",
  "simple_pronunciation": "yoo must tayk this meh-dih-KAY-shun",
  "notes": "This is a direct and natural medical instruction.",
  "audio_url": null
}
```

## Supported Audio File Types

The backend still supports these uploaded audio MIME types for recorded-audio workflows:

- `audio/webm`
- `audio/wav`
- `audio/mpeg`
- `audio/mp4`
- `audio/ogg`

## Cost Controls

- Live dictation stays in the browser and does not continuously call OpenAI.
- Translation runs only when the user clicks `Translate`, or once after dictation stops if auto-translate is enabled.
- TTS is generated only when:
  - the user clicks the play button, or
  - the user enables automatic voiceover for a translation result.
- Generated MP3 audio is cached in browser memory for the current session.

## Local Testing

### Text Translate

1. Start the backend on `127.0.0.1:8010`.
2. Start the frontend on `localhost:3000`.
3. Open `Text Translate`.
4. Enter text, choose languages, and click `Translate`.
5. Optionally click `Play Pronunciation`.

### Live Voice Dictation

1. Start the backend on `127.0.0.1:8010`.
2. Start the frontend on `localhost:3000`.
3. Open `Live Voice Dictation`.
4. Use Chrome or Edge.
5. Click `Allow Microphone Access`.
6. If several microphones appear, choose the one you want to try first.
7. Choose `English`, `French`, or `Spanish` as the source speech language.
8. Click `Start Listening` and speak a short phrase.
9. Click `Stop Listening`.
10. Edit the transcript if needed.
11. Click `Translate`.
12. Review the translation, IPA, pronunciation guide, and notes.
13. Click `Play Voiceover` or enable automatic voiceover.

## Troubleshooting

### Live speech recognition is unsupported

- Use Chrome or Microsoft Edge.
- Safari and Firefox may not fully support the Web Speech API recognition flow used by this MVP.
- If live recognition is unavailable, type into the transcript box manually.

### Microphone permission denied

- Re-enable microphone permission in the browser site settings.
- Refresh the page and try again.
- Click `Allow Microphone Access` again after permission is restored.

### No speech detected

- Keep the microphone close and speak clearly.
- Check that the selected speech language matches the language you are speaking.

### Wrong microphone is being used

- Open `Live Voice Dictation` and click `Allow Microphone Access` to reveal available microphones.
- Choose a different microphone from the dropdown and start listening again.
- If Chrome or Edge still uses the wrong input, switch the browser or system default microphone and retry.

### Failed to fetch or backend unreachable

- Make sure the backend is running at `http://127.0.0.1:8010`.
- Open `http://127.0.0.1:8010/health` in your browser.
- Confirm `frontend/.env.local` points to `http://127.0.0.1:8010`.
- Restart `npm run dev` after changing frontend env values.

### CORS errors

- Confirm `ALLOWED_ORIGINS` includes `http://localhost:3000` and `http://127.0.0.1:3000`.
- Restart the backend after editing backend env variables.

### OpenAI API key missing

- Add `OPENAI_API_KEY` to `backend/.env`.
- Restart the backend.

### Unsupported audio format

- Live dictation mode does not upload live microphone audio.
- For optional recorded-audio backend endpoints, prefer `webm`, `wav`, `mp3`, `mp4`, or `ogg`.

## Future Improvements

- database-backed translation history
- Redis caching for repeated translations
- dictionary-backed IPA lookup with Epitran, eSpeak NG, or Wiktextract
- user accounts and saved phrases
- document translation for PDF and Word files
- broader speech recognition language coverage
