import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY: str = os.environ.get("OPENAI_API_KEY", "")
OPENAI_TRANSLATION_MODEL: str = os.environ.get(
    "OPENAI_TRANSLATION_MODEL",
    os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
)
OPENAI_MODEL: str = OPENAI_TRANSLATION_MODEL
OPENAI_TRANSCRIPTION_MODEL: str = os.environ.get(
    "OPENAI_TRANSCRIPTION_MODEL",
    "gpt-4o-mini-transcribe",
)
OPENAI_TTS_MODEL: str = os.environ.get("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
TTS_DEFAULT_VOICE: str = "coral"
SUPPORTED_TTS_VOICES: list[str] = [
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "nova",
    "onyx",
    "sage",
    "shimmer",
]
MAX_TTS_TEXT_LENGTH: int = int(os.environ.get("MAX_TTS_TEXT_LENGTH", "2000"))
MAX_AUDIO_FILE_SIZE_BYTES: int = int(
    os.environ.get("MAX_AUDIO_FILE_SIZE_BYTES", str(25 * 1024 * 1024))
)
MAX_RECORDING_SECONDS: int = int(os.environ.get("MAX_RECORDING_SECONDS", "30"))
SUPPORTED_AUDIO_MIME_TYPES: list[str] = [
    "audio/webm",
    "audio/wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
]
LANGUAGE_HINT_CODES: dict[str, str] = {
    "English": "en",
    "French": "fr",
    "Spanish": "es",
    "Tagalog": "tl",
    "Hiligaynon": "hil",
    "Cebuano": "ceb",
}

if not OPENAI_API_KEY:
    import warnings
    warnings.warn(
        "OPENAI_API_KEY is not set. Set it in your .env file or as an environment variable.",
        stacklevel=2,
    )
