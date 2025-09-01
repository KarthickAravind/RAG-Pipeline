from fastapi import APIRouter
from .models import GenerateRequest, GenerateResponse
from .service import generate_iflow_artifact


router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
def api_generate(req: GenerateRequest):
    return generate_iflow_artifact(req.query, req.top_k, req.model_id)


