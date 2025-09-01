from typing import List, Optional, Literal
from pydantic import BaseModel
from typing import Dict

class RetrievedChunk(BaseModel):
    id: Optional[str] = None
    content: str
    component_type: Optional[str] = None
    dataset: Optional[str] = None
    vector_score: Optional[float] = None
    cross_encoder_score: Optional[float] = None
    metadata_boost: Optional[float] = None
    final_score: Optional[float] = None


class GenerateRequest(BaseModel):
    query: str
    top_k: int = 5
    model_id: Optional[str] = None


class GenerateResponse(BaseModel):
    query: str
    model_used: str
    validation_status: str
    artifacts: Dict[str, str]
    context_used: List[str]


