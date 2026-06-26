from typing import Optional

from fastapi import APIRouter, Query

from app.api.schemas import LogEventResponse, LogsListResponse
from app.db import repository

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get(
    "",
    response_model=LogsListResponse,
    summary="Search indexed log events",
    description="Filter stored log lines by tenant, level, source file, and free-text search.",
)
def list_logs(
    tenant: Optional[str] = Query(default=None, description="Tenant id, e.g. TENANT-X"),
    level: Optional[str] = Query(default=None, description="Log level, e.g. ERROR"),
    source: Optional[str] = Query(default=None, description="Source filename"),
    search: Optional[str] = Query(default=None, description="Search message, logger, or log id"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> LogsListResponse:
    events, total = repository.query_events(
        tenant_id=tenant,
        level=level,
        source_file=source,
        search=search,
        limit=limit,
        offset=offset,
    )

    return LogsListResponse(
        total=total,
        items=[
            LogEventResponse(
                log_id=event.log_id,
                source_file=event.source_file,
                timestamp=event.timestamp,
                tenant_id=event.tenant_id,
                level=event.level,
                logger=event.logger,
                message=event.message,
                http_status=event.http_status,
                stack_trace=event.stack_trace or [],
            )
            for event in events
        ],
        tenants=repository.get_distinct_tenants(),
        sources=repository.get_distinct_sources(),
    )
