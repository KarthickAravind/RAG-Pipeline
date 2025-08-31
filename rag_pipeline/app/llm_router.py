from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from .config import HF_TOKEN, SUPPORTED_MODELS


CHAT_HINT_KEYS = {"mistral"}


def _is_chat_model(model_id: str) -> bool:
    low = model_id.lower()
    return any(k in low for k in CHAT_HINT_KEYS)


def make_hf_llm_from_key(key: str):
    model_id = SUPPORTED_MODELS.get(key, key)
    try:
        if _is_chat_model(model_id):
            client = HuggingFaceEndpoint(
                repo_id=model_id,
                task="conversational",
                max_new_tokens=1024,
                temperature=0.2,
                huggingfacehub_api_token=HF_TOKEN,
            )
            return ChatHuggingFace(llm=client)
    except Exception:
        pass

    return HuggingFaceEndpoint(
        repo_id=model_id,
        task="text-generation",
        max_new_tokens=1024,
        temperature=0.2,
        huggingfacehub_api_token=HF_TOKEN,
    )


def choose_model_for_query(qtype: str, override_key: str = None) -> str:
    if override_key:
        return SUPPORTED_MODELS.get(override_key, override_key)
    if qtype == "groovy":
        return SUPPORTED_MODELS["mistral"]
    if qtype in ("properties", "xslt"):
        return SUPPORTED_MODELS["zephyr"]
    return SUPPORTED_MODELS["mistral"]


