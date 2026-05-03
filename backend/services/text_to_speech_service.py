import logging

from openai import OpenAIError

from backend.config import OPENAI_TTS_MODEL, TTS_DEFAULT_VOICE
from backend.services.openai_client import get_openai_client

logger = logging.getLogger(__name__)


def generate_speech(text: str, language: str, voice: str = TTS_DEFAULT_VOICE) -> bytes:
    """
    Generate MP3 audio for translated text using OpenAI text-to-speech.

    The caller is responsible for validating text length and supported voice
    before calling this function.
    """
    client = get_openai_client()
    instructions = (
        f"Speak clearly and naturally in {language}. "
        "Keep the pronunciation accurate and easy to follow."
    )

    logger.info("Calling OpenAI TTS model=%s language=%s voice=%s", OPENAI_TTS_MODEL, language, voice)

    try:
        response = client.audio.speech.create(
            model=OPENAI_TTS_MODEL,
            voice=voice,
            input=text,
            instructions=instructions,
            response_format="mp3",
        )
        return response.read()
    except OpenAIError as exc:
        logger.error("OpenAI TTS API error: %s", exc)
        raise RuntimeError(f"OpenAI TTS API error: {exc}") from exc
