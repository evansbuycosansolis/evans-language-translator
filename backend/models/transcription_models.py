from typing import Optional

from pydantic import BaseModel, field_validator

from backend.config import TTS_DEFAULT_VOICE, SUPPORTED_TTS_VOICES
from backend.models.translation_models import (
    normalize_supported_language,
    normalize_supported_tone,
)


def normalize_optional_supported_language(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    cleaned = value.strip()
    if not cleaned:
        return None

    return normalize_supported_language(cleaned, "source language")


def normalize_supported_voice(value: Optional[str]) -> str:
    cleaned = (value or TTS_DEFAULT_VOICE).strip().lower()
    if cleaned not in SUPPORTED_TTS_VOICES:
        raise ValueError(
            f"Unsupported voice '{cleaned}'. "
            f"Supported voices: {', '.join(SUPPORTED_TTS_VOICES)}"
        )
    return cleaned


class TranscriptionResponse(BaseModel):
    transcript: str
    source_language: Optional[str] = None


class TranscriptionFormData(BaseModel):
    source_language: Optional[str] = None
    profile_context: Optional[str] = None

    @field_validator("source_language")
    @classmethod
    def source_language_must_be_supported(cls, value: Optional[str]) -> Optional[str]:
        return normalize_optional_supported_language(value)

    @field_validator("profile_context")
    @classmethod
    def profile_context_must_be_reasonable(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        cleaned = value.strip()
        if not cleaned:
            return None

        return cleaned[:1200]


class SpeechTranslationResponse(BaseModel):
    source_language: str
    target_language: str
    transcript: str
    translation: str
    ipa: str
    simple_pronunciation: str
    notes: str
    audio_url: Optional[str] = None


class SpeechTranslateFormData(BaseModel):
    source_language: str
    target_language: str
    tone: str = "neutral"
    generate_voiceover: bool = False
    voice: str = TTS_DEFAULT_VOICE
    profile_context: Optional[str] = None

    @field_validator("source_language")
    @classmethod
    def source_language_must_be_supported(cls, value: str) -> str:
        return normalize_supported_language(value, "source language")

    @field_validator("target_language")
    @classmethod
    def target_language_must_be_supported(cls, value: str) -> str:
        return normalize_supported_language(value, "target language")

    @field_validator("tone")
    @classmethod
    def tone_must_be_supported(cls, value: str) -> str:
        return normalize_supported_tone(value)

    @field_validator("voice")
    @classmethod
    def voice_must_be_supported(cls, value: str) -> str:
        return normalize_supported_voice(value)

    @field_validator("profile_context")
    @classmethod
    def profile_context_must_be_reasonable(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        cleaned = value.strip()
        if not cleaned:
            return None

        return cleaned[:1200]
