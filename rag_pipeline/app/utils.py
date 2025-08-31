import re
from typing import List, Tuple
from .models import SearchResultItem

MAX_CONTEXT_CHARS = 12000


def build_context_from_items(items: List[SearchResultItem], max_chars: int = MAX_CONTEXT_CHARS) -> Tuple[str, List[str]]:
    parts = []
    used_ids = []
    total = 0
    for it in items:
        ctype = it.metadata.get('component_type', 'unknown') if it.metadata else 'unknown'
        score = it.final_score if it.final_score is not None else (it.similarity_score or 0)
        block = f"[type={ctype} id={it.id} score={score}]\n{it.content}\n[/type]\n"
        if total + len(block) > max_chars:
            break
        parts.append(block)
        used_ids.append(it.id)
        total += len(block)
    return "".join(parts), used_ids


def extract_artifacts(text: str) -> dict:
    artifacts = {}
    pattern = r"\[type=(\w+)[^\]]*\](.*?)(?=\[type=|\Z)"
    matches = re.findall(pattern, text, re.DOTALL)
    for lang, content in matches:
        lang = lang.strip().lower()
        if lang not in artifacts:
            artifacts[lang] = []
        artifacts[lang].append(content.strip())
    for k, v in list(artifacts.items()):
        if isinstance(v, list) and len(v) == 1:
            artifacts[k] = v[0]
    if not artifacts:
        artifacts["default"] = text.strip()
    return artifacts


def detect_query_type(q: str):
    ql = q.lower()
    if "groovy" in ql:
        return "groovy"
    if "xslt" in ql:
        return "xslt"
    if "properties" in ql or ".properties" in ql:
        return "properties"
    if "xml" in ql:
        return "xml"
    return "unknown"


