"""
Vercel-friendly FastAPI entrypoint.

Vercel's FastAPI runtime works best with `server.py` / `app.py` style entrypoints.
This file also bootstraps the repository root onto `sys.path` so imports keep
working even when the file is executed directly.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app

