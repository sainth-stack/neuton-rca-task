from typing import Literal, Optional

from fastapi import APIRouter, BackgroundTasks, File, Query, UploadFile

from app.api.schemas import DeleteSourceResponse, IngestRequest, IngestResponse, LogSource, UploadResponse
from app.ingest.service import (
    delete_uploaded_source,
    ingest_filenames,
    list_all_sources,
    list_uploaded_sources,
    upload_log_files,
)
from app.llm.client import is_openai_configured

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.get("/sources", response_model=list[LogSource])
def list_sources(
    scope: Optional[Literal["uploaded"]] = Query(default=None),
) -> list[LogSource]:
    if scope == "uploaded":
        return list_uploaded_sources()
    return list_all_sources()


@router.post("/upload", response_model=UploadResponse)
async def upload_logs(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
) -> UploadResponse:
    uploaded, duration_ms, indexing_async = await upload_log_files(files, background_tasks)
    message = f"Uploaded and parsed {len(uploaded)} log file(s)."
    if indexing_async:
        message += " Semantic indexing is running in the background."
    elif not is_openai_configured():
        message += " Set OPENAI_API_KEY to enable semantic indexing."
    return UploadResponse(
        message=message,
        uploaded=uploaded,
        duration_ms=duration_ms,
    )


@router.delete("/sources", response_model=DeleteSourceResponse)
def delete_source(
    filename: str = Query(...),
) -> DeleteSourceResponse:
    events_removed, vectors_removed = delete_uploaded_source(filename)
    return DeleteSourceResponse(
        message=f"Deleted {filename} and removed all indexed data.",
        filename=filename,
        events_removed=events_removed,
        vectors_removed=vectors_removed,
    )


@router.post("", response_model=IngestResponse)
def ingest_logs(payload: IngestRequest) -> IngestResponse:
    return ingest_filenames(payload.filenames)
