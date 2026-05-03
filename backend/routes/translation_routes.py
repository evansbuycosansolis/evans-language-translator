import logging
from fastapi import APIRouter, HTTPException, status

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
    except Exception as exc:
        logger.exception("Unexpected translation error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected translation failure: {exc}",
        ) from exc

    return phonetic_service.apply_pronunciation_overrides(result, request.target_language)
