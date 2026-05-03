import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError

from backend.models.transcription_models import (
    SpeechTranslateFormData,
    SpeechTranslationResponse,
)
from backend.models.translation_models import TranslationRequest
from backend.services import openai_translation_service, phonetic_service, transcription_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/speech-translate",
    response_model=SpeechTranslationResponse,
    summary="Transcribe speech and translate it in one request",
)
async def speech_translate(
    file: UploadFile | None = File(default=None),
    source_language: str = Form(...),
    target_language: str = Form(...),
    tone: str = Form(default="neutral"),
    generate_voiceover: bool = Form(default=False),
    voice: str = Form(default="coral"),
) -> SpeechTranslationResponse:
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is required.",
        )

    try:
        form_data = SpeechTranslateFormData(
            source_language=source_language,
            target_language=target_language,
            tone=tone,
            generate_voiceover=generate_voiceover,
            voice=voice,
        )
    except ValidationError as exc:
        detail = exc.errors()[0]["msg"] if exc.errors() else "Invalid speech translation request."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        ) from exc

    try:
        audio_bytes = await file.read()
        transcription = transcription_service.transcribe_audio(
            filename=file.filename or "recording.webm",
            content_type=file.content_type,
            audio_bytes=audio_bytes,
            source_language=form_data.source_language,
        )
    except ValueError as exc:
        logger.error("Speech translate validation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.error("Speech translate runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    translation_request = TranslationRequest(
        text=transcription.transcript,
        source_language=form_data.source_language,
        target_language=form_data.target_language,
        tone=form_data.tone,
    )

    try:
        translation = openai_translation_service.translate(translation_request)
        translation = phonetic_service.apply_pronunciation_overrides(
            translation,
            form_data.target_language,
        )
    except ValueError as exc:
        logger.error("Speech translate model response error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.error("Speech translate model runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return SpeechTranslationResponse(
        source_language=form_data.source_language,
        target_language=form_data.target_language,
        transcript=transcription.transcript,
        translation=translation.translation,
        ipa=translation.ipa,
        simple_pronunciation=translation.simple_pronunciation,
        notes=translation.notes,
        audio_url=None,
    )
