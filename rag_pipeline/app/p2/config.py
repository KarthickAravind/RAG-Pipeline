import os
import sys

_here = os.path.dirname(__file__)
_repo_src = os.path.normpath(os.path.join(_here, "../../../../retrival sys (cobert)/src"))
if _repo_src not in sys.path:
    sys.path.insert(0, _repo_src)

from config import settings  # type: ignore

__all__ = ["settings"]


