from dataclasses import dataclass
from pathlib import Path

from openai import OpenAIError

from backend.config import (
    LANGUAGE_HINT_CODES,
    MAX_AUDIO_FILE_SIZE_BYTES,
    OPENAI_TRANSCRIPTION_MODEL,
    SUPPORTED_AUDIO_MIME_TYPES,
)
from backend.services.openai_client import get_openai_client


SUPPORTED_AUDIO_EXTENSIONS: dict[str, str] = {
    ".webm": "audio/webm",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".mpeg": "audio/mpeg",
    ".mp4": "audio/mp4",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
}


@dataclass
class TranscriptionResult:
    transcript: str
    source_language: str | None = None


def transcribe_audio(
    *,
    filename: str,
    content_type: str | None,
    audio_bytes: bytes,
    source_language: str | None = None,
) -> TranscriptionResult:
    normalized_filename = _normalize_filename(filename, content_type)
    normalized_content_type = _normalize_content_type(content_type, normalized_filename)

    if not audio_bytes:
        raise ValueError("Audio file is empty.")

    if len(audio_bytes) > MAX_AUDIO_FILE_SIZE_BYTES:
        max_size_mb = MAX_AUDIO_FILE_SIZE_BYTES / (1024 * 1024)
        raise ValueError(
            f"Audio file is too large. Maximum supported size is {max_size_mb:.0f} MB."
        )

    prompt = (
        f"The speaker is using {source_language}. Preserve punctuation and casing."
        if source_language
        else "Preserve punctuation and casing."
    )

    request_args = {
        "model": OPENAI_TRANSCRIPTION_MODEL,
        "file": (normalized_filename, audio_bytes, normalized_content_type),
        "prompt": prompt,
        "response_format": "json",
    }

    language_hint = LANGUAGE_HINT_CODES.get(source_language or "")
    if language_hint:
        request_args["language"] = language_hint

    client = get_openai_client()

    try:
        response = client.audio.transcriptions.create(**request_args)
    except OpenAIError as exc:
        raise RuntimeError(f"OpenAI transcription error: {exc}") from exc

    transcript_text = response if isinstance(response, str) else response.text
    normalized_transcript = transcript_text.strip()
    if not normalized_transcript:
        raise ValueError("No speech was detected in the uploaded audio.")

    return TranscriptionResult(
        transcript=normalized_transcript,
        source_language=source_language,
    )


def _normalize_filename(filename: str | None, content_type: str | None) -> str:
    cleaned = (filename or "").strip()
    if cleaned:
        return cleaned

    fallback_extension = _extension_from_content_type(content_type)
    return f"recording{fallback_extension}"


def _normalize_content_type(content_type: str | None, filename: str) -> str:
    normalized = (content_type or "").split(";")[0].strip().lower()
    if normalized in SUPPORTED_AUDIO_MIME_TYPES:
        return normalized

    extension = Path(filename).suffix.lower()
    inferred = SUPPORTED_AUDIO_EXTENSIONS.get(extension)
    if inferred:
        return inferred

    supported_types = ", ".join(SUPPORTED_AUDIO_MIME_TYPES)
    raise ValueError(
        f"Unsupported audio type '{content_type or extension or 'unknown'}'. "
        f"Supported types: {supported_types}."
    )


def _extension_from_content_type(content_type: str | None) -> str:
    normalized = (content_type or "").split(";")[0].strip().lower()
    for extension, mime_type in SUPPORTED_AUDIO_EXTENSIONS.items():
        if mime_type == normalized:
            return extension
    return ".webm"
