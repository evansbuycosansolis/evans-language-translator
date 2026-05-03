import logging

from fastapi import APIRouter, HTTPException, Response, status

from backend.models.tts_models import TextToSpeechRequest
from backend.services import text_to_speech_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/text-to-speech",
    summary="Generate pronunciation audio for translated text",
    responses={
        200: {
            "description": "MP3 audio response",
            "content": {"audio/mpeg": {}},
        }
    },
)
async def text_to_speech(request: TextToSpeechRequest) -> Response:
    try:
        audio_bytes = text_to_speech_service.generate_speech(
            text=request.text,
            language=request.language,
            voice=request.voice,
        )
    except RuntimeError as exc:
        logger.error("TTS runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="translation-pronunciation.mp3"',
            "Cache-Control": "no-store",
        },
    )
