from datetime import datetime, timezone
from fastapi import APIRouter
from app.schemas import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        status="healthy",
        service="KeyMuse API",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc)
    )
