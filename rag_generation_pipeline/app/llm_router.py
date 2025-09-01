from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from .config import HF_TOKEN, SUPPORTED_MODELS


# Models that only support conversational API
CHAT_ONLY_MODELS = {
    "mistral",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "HuggingFaceH4/zephyr-7b-beta",
    "google/gemma-7b-it",
}


def make_hf_llm(model_id: str):
    """
    Auto-selects between ChatHuggingFace and HuggingFaceEndpoint
    depending on model capabilities.
    """
    if any(key in model_id for key in CHAT_ONLY_MODELS):
        llm = HuggingFaceEndpoint(
            repo_id=model_id,
            task="conversational",
            max_new_tokens=1024,
            temperature=0.2,
            huggingfacehub_api_token=HF_TOKEN,
        )
        return ChatHuggingFace(llm=llm)

    return HuggingFaceEndpoint(
        repo_id=model_id,
        task="text-generation",
        max_new_tokens=1024,
        temperature=0.2,
        huggingfacehub_api_token=HF_TOKEN,
    )


def choose_model(qtype: str, override: str = None):
    if override:
        return SUPPORTED_MODELS.get(override, override)

    if qtype == "groovy":
        return SUPPORTED_MODELS["mistral"]     # or SUPPORTED_MODELS["zephyr"]
    if qtype == "xml":
        return SUPPORTED_MODELS["mistral"]
    if qtype == "properties":
        return SUPPORTED_MODELS["zephyr"]      # use zephyr for props
    if qtype == "xslt":
        return SUPPORTED_MODELS["gemma"]       # use gemma for xslt

    return SUPPORTED_MODELS["mistral"]         # safe fallback
