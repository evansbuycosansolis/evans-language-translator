"""
Phonetic service — placeholder for future IPA generation tools.

In the MVP, IPA and simple pronunciation are produced by the OpenAI service.
This module is designed so a dedicated phonetic engine (Epitran, eSpeak NG,
Wiktionary/Wiktextract) can be plugged in later without touching the rest of
the codebase.
"""
from typing import Optional

from backend.models.translation_models import TranslationResponse


def get_ipa(text: str, language: str) -> Optional[str]:
    """
    Return IPA transcription for *text* in *language*.

    Currently returns None, which signals to the caller that it should fall
    back to the OpenAI-generated IPA.  Replace this body when a dedicated
    phonetic backend is available.
    """
    return None


def get_simple_pronunciation(text: str, language: str) -> Optional[str]:
    """
    Return a human-readable pronunciation guide for *text* in *language*.

    Currently returns None (fall back to OpenAI output).
    """
    return None


def apply_pronunciation_overrides(
    result: TranslationResponse,
    target_language: str,
) -> TranslationResponse:
    dedicated_ipa = get_ipa(result.translation, target_language)
    if dedicated_ipa:
        result.ipa = dedicated_ipa

    dedicated_pronunciation = get_simple_pronunciation(result.translation, target_language)
    if dedicated_pronunciation:
        result.simple_pronunciation = dedicated_pronunciation

    return result
