import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.translation_routes import router as translation_router
from backend.routes.transcription_routes import router as transcription_router
from backend.routes.speech_translate_routes import router as speech_translate_router
from backend.routes.tts_routes import router as tts_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

app = FastAPI(
    title="Evans Language Translator API",
    description=(
        "AI-powered language translator with IPA phonetic transcription "
        "guidance, speech transcription, and text-to-speech support."
    ),
    version="1.1.0",
)

# Allow the Next.js dev server and any production origin.
# Restrict origins in production by setting the ALLOWED_ORIGINS env variable.
import os

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(translation_router, prefix="/api")
app.include_router(transcription_router, prefix="/api")
app.include_router(speech_translate_router, prefix="/api")
app.include_router(tts_router, prefix="/api")


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok"}
