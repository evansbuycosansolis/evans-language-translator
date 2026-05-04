"""
Vercel-friendly FastAPI entrypoint.

When the `backend/` directory is used as the Vercel service entrypoint, this
file becomes the service-root `server.py` that Vercel expects for FastAPI.
It also bootstraps a lightweight `backend` package so the existing
`backend.*` imports continue to work when the service is loaded from inside the
`backend/` directory itself.
"""

import sys
import types
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
current_dir_str = str(CURRENT_DIR)
if current_dir_str not in sys.path:
    sys.path.insert(0, current_dir_str)

package = types.ModuleType("backend")
package.__path__ = [current_dir_str]
package.__file__ = str(CURRENT_DIR / "__init__.py")
sys.modules.setdefault("backend", package)

from main import app
