from fastapi import APIRouter, HTTPException

from app.bn_builder import run_inference
from app.models import InferencePayload, InferenceResponse

router = APIRouter()


@router.post("/infer", response_model=InferenceResponse)
async def infer(payload: InferencePayload) -> InferenceResponse:
    try:
        return run_inference(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")
