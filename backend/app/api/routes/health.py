from fastapi import APIRouter

from app.api.schemas import HealthResponse
from app.config import get_settings
from app.db import repository
from app.db.database import count_events
from app.llm.client import is_openai_configured

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns service name, version, and a simple status flag. Use this to confirm the API is up.",
)
def health_check() -> HealthResponse:
    settings = get_settings()
    indexed_events = count_events()
    indexed_tenants = len(repository.get_distinct_tenants())
    error_warn_events = repository.count_events(level="ERROR") + repository.count_events(level="WARN")
    uploaded_sources = len(repository.list_stored_sources("uploaded"))

    return HealthResponse(
        status="ok",
        version=settings.app_version,
        service=settings.app_name,
        openai_configured=is_openai_configured(),
        indexed_events=indexed_events,
        indexed_tenants=indexed_tenants,
        error_warn_events=error_warn_events,
        uploaded_sources=uploaded_sources,
    )
