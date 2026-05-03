from openai import OpenAI

from backend.config import OPENAI_API_KEY

_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError(
                "OPENAI_API_KEY is not configured. "
                "Set it in your .env file or as an environment variable."
            )
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client
