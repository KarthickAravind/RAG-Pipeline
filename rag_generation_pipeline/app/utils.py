import re
from typing import List, Tuple
from .models import RetrievedChunk

MAX_CONTEXT_CHARS = 12000


def build_context(chunks: List[RetrievedChunk], max_chars: int = MAX_CONTEXT_CHARS) -> Tuple[str, List[str]]:
    parts, used_ids, total = [], [], 0
    for ch in chunks:
        block = f"[type={ch.component_type or 'unknown'}]\n{ch.content}\n"
        if total + len(block) > max_chars:
            break
        parts.append(block)
        used_ids.append(ch.id or "-")
        total += len(block)
    return "".join(parts), used_ids


def extract_artifacts(text: str) -> dict:
    """
    Extract artifacts from [type=...]... blocks.
    Normalize weird/mistyped tags into known categories.
    Support multiple artifacts under the same type.
    """
    artifacts = {}
    pattern = r"\[type=(\w+)\](.*?)(?=\[type=|\Z)"
    matches = re.findall(pattern, text, re.DOTALL)

    normalize_map = {
        "integration": "xml",
        "integrationflow": "xml",
        "java": "groovy",         # treat Java-like output as Groovy-ish
        "groovyscript": "groovy",
        "property-file": "properties",
        "prop": "properties",
    }

    for lang, content in matches:
        lang = lang.strip().lower()
        lang = normalize_map.get(lang, lang)  # normalize invalid types

        if lang not in artifacts:
            artifacts[lang] = []
        artifacts[lang].append(content.strip())

    # flatten single-item lists
    for k, v in list(artifacts.items()):
        if isinstance(v, list) and len(v) == 1:
            artifacts[k] = v[0]

    # fallback: if no markers, return raw text under 'default'
    if not artifacts:
        artifacts["default"] = text.strip()

    return artifacts


def detect_query_type(q: str):
    ql = q.lower()
    if "groovy" in ql:
        return "groovy"
    if "xml" in ql and "xslt" not in ql:
        return "xml"
    if "xslt" in ql:
        return "xslt"
    if "properties" in ql:
        return "properties"
    return "unknown"


