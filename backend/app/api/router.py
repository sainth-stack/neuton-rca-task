from fastapi import APIRouter

from app.api.routes import health, ingest, investigate, logs

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(ingest.router)
api_router.include_router(investigate.router)
api_router.include_router(logs.router)
