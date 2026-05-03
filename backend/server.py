"""
Vercel-friendly FastAPI entrypoint.

Vercel's FastAPI runtime works best with `server.py` / `app.py` style entrypoints.
This file also bootstraps the repository root onto `sys.path` so imports keep
working even when the file is executed directly.
"""

import sys
import types
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
CANDIDATE_PATHS = [
    CURRENT_DIR,
    CURRENT_DIR.parent,
]

for candidate in CANDIDATE_PATHS:
    candidate_str = str(candidate)
    if candidate_str not in sys.path:
        sys.path.insert(0, candidate_str)

try:
    from backend.main import app
except ModuleNotFoundError:
    package = types.ModuleType("backend")
    package.__path__ = [str(CURRENT_DIR)]
    package.__file__ = str(CURRENT_DIR / "__init__.py")
    sys.modules["backend"] = package

    from backend.main import app
