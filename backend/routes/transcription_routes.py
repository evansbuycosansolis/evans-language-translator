import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError

from backend.models.transcription_models import (
    TranscriptionFormData,
    TranscriptionResponse,
)
from backend.services import transcription_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    summary="Transcribe recorded speech into text",
)
async def transcribe_audio(
    file: UploadFile | None = File(default=None),
    source_language: str | None = Form(default=None),
    profile_context: str | None = Form(default=None),
) -> TranscriptionResponse:
    if file is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is required.",
        )

    try:
        form_data = TranscriptionFormData(
            source_language=source_language,
            profile_context=profile_context,
        )
    except ValidationError as exc:
        detail = exc.errors()[0]["msg"] if exc.errors() else "Invalid transcription request."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        ) from exc

    try:
        audio_bytes = await file.read()
        result = transcription_service.transcribe_audio(
            filename=file.filename or "recording.webm",
            content_type=file.content_type,
            audio_bytes=audio_bytes,
            source_language=form_data.source_language,
            profile_context=form_data.profile_context,
        )
    except ValueError as exc:
        logger.error("Transcription validation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.error("Transcription runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return TranscriptionResponse(
        transcript=result.transcript,
        source_language=result.source_language,
    )
