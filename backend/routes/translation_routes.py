import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import ValidationError

from backend.models.translation_models import TranslationRequest, TranslationResponse
from backend.services import openai_translation_service, phonetic_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="Translate text with IPA and pronunciation guidance",
)
async def translate_text(request: TranslationRequest) -> TranslationResponse:
    """
    Translate *text* from *source_language* to *target_language* and return:
    - translated text
    - IPA phonetic transcription of the translation
    - simple pronunciation guide
    - short grammar / usage notes
    """
    try:
        result = openai_translation_service.translate(request)
    except RuntimeError as exc:
        # OpenAI API unavailable / key missing
        logger.error("Translation runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        # Bad response structure from OpenAI
        logger.error("Translation value error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    # Override IPA / pronunciation with dedicated phonetic service if available
    dedicated_ipa = phonetic_service.get_ipa(result.translation, request.target_language)
    if dedicated_ipa:
        result.ipa = dedicated_ipa

    dedicated_pronunciation = phonetic_service.get_simple_pronunciation(
        result.translation, request.target_language
    )
    if dedicated_pronunciation:
        result.simple_pronunciation = dedicated_pronunciation

    return result
