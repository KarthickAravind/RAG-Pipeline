from typing import List
import torch
from transformers import AutoTokenizer, AutoModel
from config import settings

class CodeBERTEmbedder:
    def __init__(self, model_name: str | None = None, device: str | None = None, max_length: int | None = None, hf_token: str | None = None):
        self.model_name = model_name or settings.model_name
        requested_device = device or settings.device
        if requested_device.startswith("cuda") and not torch.cuda.is_available():
            self.device = "cpu"
        else:
            self.device = requested_device
        self.max_length = max_length or settings.max_length
        auth_token = hf_token or settings.hf_token or None
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, use_fast=True, token=auth_token)
        self.model = AutoModel.from_pretrained(self.model_name, token=auth_token)
        self.model.to(self.device)
        self.model.eval()

    @torch.no_grad()
    def embed(self, texts: List[str]) -> torch.Tensor:
        if len(texts) == 0:
            return torch.empty(0, self.model.config.hidden_size)
        batch = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )
        batch = {k: v.to(self.device) for k, v in batch.items()}
        outputs = self.model(**batch)
        token_embeddings = outputs.last_hidden_state
        attention_mask = batch["attention_mask"].unsqueeze(-1)
        masked = token_embeddings * attention_mask
        summed = masked.sum(dim=1)
        counts = attention_mask.sum(dim=1).clamp(min=1)
        mean_pooled = summed / counts
        return mean_pooled.detach().cpu()
