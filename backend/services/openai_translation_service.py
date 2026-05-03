import json
import logging
from openai import OpenAIError

from backend.config import OPENAI_TRANSLATION_MODEL
from backend.models.translation_models import TranslationRequest, TranslationResponse
from backend.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "You are a professional translator and phonetics assistant. "
    "Return ONLY valid JSON — no markdown, no code fences, no extra text. "
    "The JSON must have exactly these keys: "
    "original_text, source_language, target_language, translation, ipa, "
    "simple_pronunciation, notes. "
    "The 'ipa' field should contain dictionary-style IPA transcription of the "
    "translated text. "
    "The 'simple_pronunciation' field should be easy for non-linguists to read "
    "(e.g. English phonetic spelling). "
    "The 'notes' field should contain a short grammar or usage note (1–3 sentences)."
)


def translate(request: TranslationRequest) -> TranslationResponse:
    """Call OpenAI to translate text and return a structured response."""
    client = get_openai_client()

    tone_instruction = (
        f" Use a {request.tone} tone." if request.tone and request.tone != "neutral" else ""
    )

    user_message = (
        f"Translate the following text from {request.source_language} to "
        f"{request.target_language}.{tone_instruction}\n\n"
        f"Text: {request.text}"
    )

    logger.info(
        "Calling OpenAI model=%s src=%s tgt=%s",
        OPENAI_TRANSLATION_MODEL,
        request.source_language,
        request.target_language,
    )

    try:
        completion = client.chat.completions.create(
            model=OPENAI_TRANSLATION_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
    except OpenAIError as exc:
        logger.error("OpenAI API error: %s", exc)
        raise RuntimeError(f"OpenAI API error: {exc}") from exc

    raw_content = completion.choices[0].message.content or ""

    try:
        data: dict = json.loads(raw_content)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse OpenAI JSON response: %s", raw_content)
        raise ValueError(f"Invalid JSON returned by OpenAI: {exc}") from exc

    required_keys = {
        "original_text",
        "source_language",
        "target_language",
        "translation",
        "ipa",
        "simple_pronunciation",
        "notes",
    }
    missing = required_keys - data.keys()
    if missing:
        logger.error("OpenAI response missing keys: %s", missing)
        raise ValueError(f"OpenAI response missing required fields: {missing}")

    return TranslationResponse(**{k: str(v) for k, v in data.items() if k in required_keys})
