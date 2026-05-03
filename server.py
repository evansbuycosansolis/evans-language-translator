"""
Root FastAPI entrypoint for Vercel Services.

Vercel's Python runtime looks for a top-level `app`, `application`, or
`handler` inside the selected entrypoint file. Exposing the FastAPI app from a
root-level `server.py` keeps the backend deployment aligned with that
expectation while the actual application code stays under `backend/`.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
project_root_str = str(PROJECT_ROOT)
if project_root_str not in sys.path:
    sys.path.insert(0, project_root_str)

from backend.main import app as fastapi_app

app = fastapi_app

