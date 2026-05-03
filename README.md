# Evans Language Translator

AI-powered language translation with pronunciation guidance, text-to-speech, and voice-to-text translation mode.

## Overview

Evans Language Translator is a full-stack MVP that lets users:

- translate typed text
- record speech and transcribe it
- translate the transcript into another language
- view IPA and simple pronunciation guidance
- optionally generate spoken audio for the translated result

The Next.js frontend talks to a FastAPI backend. The OpenAI API key stays on the backend only and is never exposed to the browser.

## Features

- Text Translate mode for typed input
- Voice Translate mode for microphone recording
- Translation tone selection: `neutral`, `formal`, `informal`
- IPA transcription and simple pronunciation guidance
- Grammar and usage notes
- On-demand text-to-speech playback
- Optional automatic voiceover after voice translation
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
OPENAI_MODEL=gpt-4o-mini
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

## Voice Translate Mode

Voice Translate Mode records audio in the browser first and uploads it only after recording stops. That keeps the MVP simpler and avoids continuous streaming cost.

Voice flow:

1. Choose source language, target language, tone, and optional voiceover settings.
2. Click `Start Recording`.
3. Speak into the microphone.
4. Click `Stop Recording`.
5. Review the audio preview.
6. Click `Translate Speech`.
7. The backend transcribes the recording, translates the transcript, and returns pronunciation guidance.
8. If automatic voiceover is enabled, the frontend calls `/api/text-to-speech` for the translated text and plays it back.

## Microphone Permissions

The browser will ask for microphone access the first time Voice Translate mode starts recording.

- If the user denies access, recording cannot start.
- The app surfaces a clear permission error in the UI.
- No microphone audio is continuously streamed to OpenAI.

## Supported Languages

- English
- French
- Spanish
- Tagalog
- Hiligaynon
- Cebuano

## Supported Voice Options

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

## Supported Audio File Types

The backend validates these uploaded audio MIME types for the MVP:

- `audio/webm`
- `audio/wav`
- `audio/mpeg`
- `audio/mp4`
- `audio/ogg`

Browser recording is optimized for `audio/webm` when MediaRecorder supports it.

## API Endpoints

### `POST /api/translate`

Translate typed text and return pronunciation guidance.

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

### `POST /api/transcribe`

Transcribe recorded speech into text.

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

Transcribe uploaded speech and translate it in one request.

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

## Cost Controls

- Microphone audio is not streamed continuously to OpenAI.
- Recording is capped at 30 seconds for the MVP.
- TTS is generated only when:
  - the user clicks the play button, or
  - the user enables automatic voiceover in Voice Translate mode.
- Generated MP3 audio is cached in browser memory for the current session.

## Local Testing

### Text Translate

1. Start the backend on `127.0.0.1:8010`.
2. Start the frontend on `localhost:3000`.
3. Open Text Translate mode.
4. Enter text, choose languages, and click `Translate`.
5. Optionally click `Play Pronunciation`.

### Voice Translate

1. Start the backend on `127.0.0.1:8010`.
2. Start the frontend on `localhost:3000`.
3. Switch to Voice Translate mode.
4. Allow microphone access.
5. Record a short phrase and stop recording.
6. Click `Translate Speech`.
7. Review transcript, translation, IPA, and notes.
8. If voiceover is enabled, wait for the audio player to appear and play.

## Troubleshooting

### Microphone permission denied

- Re-enable microphone permission in the browser site settings.
- Refresh the page and try again.

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

- Use browser recording from the built-in recorder when possible.
- If uploading or replaying custom recordings later, prefer `webm`, `wav`, `mp3`, `mp4`, or `ogg`.

## Future Improvements

- database-backed translation history
- Redis caching for repeated translations
- dictionary-backed IPA lookup with Epitran, eSpeak NG, or Wiktextract
- user accounts and saved phrases
- document translation for PDF and Word files
- more languages and stronger speech-language detection
