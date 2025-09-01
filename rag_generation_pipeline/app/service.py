from fastapi import HTTPException
from types import SimpleNamespace
from .models import GenerateResponse
from .utils import detect_query_type, build_context, extract_artifacts   # ✅ updated
from .prompts import PROMPTS
from .llm_router import make_hf_llm, choose_model
from .retriever_client import call_retriever
from .validation import validate_xml, validate_properties


def generate_iflow_artifact(query: str, top_k: int, model_id: str = None) -> GenerateResponse:
    qtype = detect_query_type(query)

    # 🔄 Try retriever, fallback to dummy chunks if unavailable
    try:
        chunks = call_retriever(query, top_k)
    except Exception as e:
        print(f"[WARN] Retriever unavailable: {e}. Using dummy chunks instead.")
        chunks = [
            SimpleNamespace(id="dummy-1", content="<IntegrationFlow>Dummy SAP iFlow XML</IntegrationFlow>", component_type="xml"),
            SimpleNamespace(id="dummy-2", content="Groovy script example: println('Dummy logging script')", component_type="groovy"),
            SimpleNamespace(id="dummy-3", content="properties.example=true", component_type="properties"),
        ]

    if not chunks:
        raise HTTPException(status_code=404, detail="No context available (retriever + dummy failed)")

    context_text, used_ids = build_context(chunks)

    # Select correct prompt + model
    tmpl = PROMPTS[qtype]
    chosen_model = choose_model(qtype, override=model_id)
    llm = make_hf_llm(chosen_model)
    chain = tmpl | llm

    # Run model
    raw = chain.invoke({"query": query, "context": context_text})

    # ✅ Handle ChatMessage/AIMessage case
    if hasattr(raw, "content"):
        text = raw.content
    else:
        text = str(raw)

    # ✅ Extract structured artifacts
    artifacts = extract_artifacts(text)

    # Validation (per artifact type if available)
    vstatus = "unchecked"
    if "xml" in artifacts:
        vstatus = "valid" if validate_xml(artifacts["xml"]) else "invalid"
    elif "properties" in artifacts:
        vstatus = "valid" if validate_properties(artifacts["properties"]) else "invalid"

    return GenerateResponse(
        query=query,
        model_used=chosen_model,
        validation_status=vstatus,
        artifacts=artifacts,      # ✅ now structured dict instead of single string
        context_used=used_ids,
    )
