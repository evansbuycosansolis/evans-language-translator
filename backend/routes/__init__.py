from backend.routes.translation_routes import router as translation_router
from backend.routes.transcription_routes import router as transcription_router
from backend.routes.speech_translate_routes import router as speech_translate_router
from backend.routes.tts_routes import router as tts_router

__all__ = [
    "speech_translate_router",
    "transcription_router",
    "translation_router",
    "tts_router",
]
