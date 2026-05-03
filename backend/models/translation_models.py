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


class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str
    tone: Optional[str] = "neutral"

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("text must not be empty")
        return v.strip()

    @field_validator("source_language")
    @classmethod
    def source_language_must_be_supported(cls, v: str) -> str:
        if v not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported source language '{v}'. "
                f"Supported languages: {', '.join(SUPPORTED_LANGUAGES)}"
            )
        return v

    @field_validator("target_language")
    @classmethod
    def target_language_must_be_supported(cls, v: str) -> str:
        if v not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported target language '{v}'. "
                f"Supported languages: {', '.join(SUPPORTED_LANGUAGES)}"
            )
        return v

    @field_validator("tone")
    @classmethod
    def tone_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in SUPPORTED_TONES:
            raise ValueError(
                f"Unsupported tone '{v}'. "
                f"Supported tones: {', '.join(SUPPORTED_TONES)}"
            )
        return v


class TranslationResponse(BaseModel):
    original_text: str
    source_language: str
    target_language: str
    translation: str
    ipa: str
    simple_pronunciation: str
    notes: str
