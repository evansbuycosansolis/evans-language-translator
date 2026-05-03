from pydantic import BaseModel, field_validator

from backend.config import MAX_TTS_TEXT_LENGTH, TTS_DEFAULT_VOICE
from backend.models.transcription_models import normalize_supported_voice
from backend.models.translation_models import SUPPORTED_LANGUAGES


class TextToSpeechRequest(BaseModel):
    text: str
    language: str
    voice: str = TTS_DEFAULT_VOICE

    @field_validator("text")
    @classmethod
    def text_must_be_present_and_short_enough(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("text must not be empty")
        if len(cleaned) > MAX_TTS_TEXT_LENGTH:
            raise ValueError(
                f"text is too long. Maximum length is {MAX_TTS_TEXT_LENGTH} characters"
            )
        return cleaned

    @field_validator("language")
    @classmethod
    def language_must_be_supported(cls, value: str) -> str:
        cleaned = value.strip()
        if cleaned not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported language '{cleaned}'. "
                f"Supported languages: {', '.join(SUPPORTED_LANGUAGES)}"
            )
        return cleaned

    @field_validator("voice")
    @classmethod
    def voice_must_be_supported(cls, value: str) -> str:
        return normalize_supported_voice(value)
