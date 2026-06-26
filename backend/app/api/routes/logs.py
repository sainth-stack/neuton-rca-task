from typing import Optional

from fastapi import APIRouter, Query

from app.api.schemas import LogEventResponse, LogsListResponse
from app.db import repository

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=LogsListResponse)
def list_logs(
    tenant: Optional[str] = Query(default=None),
    level: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
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
