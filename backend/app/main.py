from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.inference import router as inference_router

app = FastAPI(title="ArgMap Inference", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inference_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
