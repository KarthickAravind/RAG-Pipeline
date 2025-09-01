import re
from typing import List, Tuple
from .models import SearchResultItem

MAX_CONTEXT_CHARS = 12000


def build_context_from_items(items: List[SearchResultItem], max_chars: int = MAX_CONTEXT_CHARS) -> Tuple[str, List[str]]:
    parts = []
    used_ids = []
    total = 0

    # Add context analysis header
    header = "=== CONTEXT ANALYSIS INSTRUCTIONS ===\n"
    header += "CRITICAL: The following context contains REAL SAP integration patterns.\n"
    header += "EXTRACT and USE specific function names, class names, imports, and patterns.\n"
    header += "DO NOT generate generic code - use the ACTUAL patterns shown below.\n\n"
    parts.append(header)
    total += len(header)

    for i, it in enumerate(items, 1):
        ctype = it.metadata.get('component_type', 'unknown') if it.metadata else 'unknown'
        score = it.final_score if it.final_score is not None else (it.similarity_score or 0)
        file_name = it.metadata.get('file_name', 'unknown') if it.metadata else 'unknown'

        # Enhanced context block with more metadata
        block = f"=== CONTEXT ITEM {i} ===\n"
        block += f"Type: {ctype}\n"
        block += f"File: {file_name}\n"
        block += f"Relevance Score: {score:.3f}\n"
        block += f"ID: {it.id}\n\n"
        block += f"CONTENT (USE THESE SPECIFIC PATTERNS):\n"
        block += f"{it.content}\n"
        block += f"=== END CONTEXT ITEM {i} ===\n\n"

        if total + len(block) > max_chars:
            break
        parts.append(block)
        used_ids.append(it.id)
        total += len(block)

    # Add footer with emphasis
    footer = "=== CONTEXT USAGE REMINDER ===\n"
    footer += "MUST USE: Specific function names, class names, and patterns from above context.\n"
    footer += "MUST INCLUDE: Actual business logic and error handling patterns shown.\n"
    footer += "MUST FOLLOW: Coding style and naming conventions from the context.\n\n"
    parts.append(footer)

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


