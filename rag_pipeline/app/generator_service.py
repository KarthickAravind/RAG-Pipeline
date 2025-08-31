from typing import List, Optional
from .llm_router import make_hf_llm_from_key, choose_model_for_query
from .prompts import PROMPTS
from .utils import build_context_from_items, extract_artifacts, detect_query_type
from .models import SearchResultItem
from .validation import validate_xml, validate_properties


def generate_from_selected(query: str, selected_items: List[SearchResultItem], model_key: Optional[str] = None):
    qtype = detect_query_type(query)
    model_id = choose_model_for_query(qtype, override_key=model_key)
    llm = make_hf_llm_from_key(model_key or "mistral")
    tmpl = PROMPTS.get(qtype, PROMPTS["unknown"])

    context_text, used_ids = build_context_from_items(selected_items)
    chain = tmpl | llm
    raw = chain.invoke({"query": query, "context": context_text})

    text = raw.content if hasattr(raw, "content") else str(raw)
    artifacts = extract_artifacts(text)

    vstatus = "unchecked"
    if "xml" in artifacts:
        vstatus = "valid" if validate_xml(artifacts["xml"]) else "invalid"
    elif "properties" in artifacts:
        vstatus = "valid" if validate_properties(artifacts["properties"]) else "invalid"

    return {
        "query": query,
        "model_used": model_id,
        "validation_status": vstatus,
        "artifacts": artifacts,
        "context_used": used_ids
    }


