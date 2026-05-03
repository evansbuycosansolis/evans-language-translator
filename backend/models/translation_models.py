from typing import Optional
from pydantic import BaseModel, field_validator


SUPPORTED_LANGUAGES = [
    "English",
    "French",
    "Spanish",
    "Tagalog",
    "Hiligaynon",
    "Cebuano",
]

SUPPORTED_TONES = ["neutral", "formal", "informal"]


def normalize_text(value: str) -> str:
    if not value or not value.strip():
        raise ValueError("text must not be empty")
    return value.strip()


def normalize_supported_language(value: str, field_name: str) -> str:
    cleaned = value.strip()
    if cleaned not in SUPPORTED_LANGUAGES:
        raise ValueError(
            f"Unsupported {field_name} '{cleaned}'. "
            f"Supported languages: {', '.join(SUPPORTED_LANGUAGES)}"
        )
    return cleaned


def normalize_supported_tone(value: Optional[str]) -> str:
    normalized = (value or "neutral").strip().lower()
    if normalized not in SUPPORTED_TONES:
        raise ValueError(
            f"Unsupported tone '{normalized}'. "
            f"Supported tones: {', '.join(SUPPORTED_TONES)}"
        )
    return normalized


class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str
    tone: Optional[str] = "neutral"

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        return normalize_text(v)

    @field_validator("source_language")
    @classmethod
    def source_language_must_be_supported(cls, v: str) -> str:
        return normalize_supported_language(v, "source language")

    @field_validator("target_language")
    @classmethod
    def target_language_must_be_supported(cls, v: str) -> str:
        return normalize_supported_language(v, "target language")

    @field_validator("tone")
    @classmethod
    def tone_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        return normalize_supported_tone(v)


class TranslationResultFields(BaseModel):
    source_language: str
    target_language: str
    translation: str
    ipa: str
    simple_pronunciation: str
    notes: str


class TranslationResponse(TranslationResultFields):
    original_text: str
