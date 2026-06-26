from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from pathlib import Path

from fastapi import BackgroundTasks, HTTPException, UploadFile

from app.api.schemas import IngestResponse, LogSource
from app.config import get_settings
from app.db import repository
from app.db.database import init_db
from app.ingest.parser import parse_log_entries, parse_log_file
from app.llm.client import is_openai_configured
from app.vector.store import get_vector_store

_embedding_files: set[str] = set()
_resuming_embeds: set[str] = set()


def bootstrap_data() -> None:
    init_db()


def _resolve_path(relative: str) -> Path:
    path = Path(relative)
    if not path.is_absolute():
        path = Path.cwd() / path
    return path.resolve()


def _resolve_upload_dir() -> Path:
    return _resolve_path(get_settings().upload_dir)


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _stats_to_source(path: Path, source_type: str, description: str | None = None) -> LogSource:
    stats = parse_log_file(path)
    return LogSource(
        filename=stats.filename,
        lines=stats.total_lines,
        tenants=sorted(stats.tenants),
        status="ready" if stats.parsed_lines > 0 else "error",
        last_ingested=None,
        source_type=source_type,
        description=description,
    )


def _persist_file(path: Path, source: LogSource) -> tuple[int, int, set[str]]:
    entries, stats = parse_log_entries(path)
    repository.persist_parsed_file(source, entries, stats)
    return stats.parsed_lines, stats.unparsed_lines, stats.tenants


def _embed_file(filename: str, path: Path) -> int:
    _embedding_files.add(filename)
    try:
        if not is_openai_configured():
            return 0
        entries, _ = parse_log_entries(path)
        return get_vector_store().index_entries(filename, entries)
    finally:
        _embedding_files.discard(filename)
        repository.update_source_status(filename, "ready")


def _build_source_from_parse(
    filename: str,
    stats,
    *,
    status: str,
    ingested_at: str,
) -> LogSource:
    return LogSource(
        filename=filename,
        lines=stats.total_lines,
        tenants=sorted(stats.tenants),
        status=status,
        last_ingested=ingested_at,
        source_type="uploaded",
    )


def _index_file(path: Path, source: LogSource) -> tuple[int, int, set[str], int]:
    file_parsed, file_errors, file_tenants = _persist_file(path, source)
    embedded = _embed_file(source.filename, path)
    return file_parsed, file_errors, file_tenants, embedded


def _upload_path(filename: str) -> Path:
    return _resolve_upload_dir() / filename


def _source_exists(filename: str) -> bool:
    if repository.get_stored_source(filename):
        return True
    return _upload_path(filename).is_file()


def list_uploaded_sources() -> list[LogSource]:
    sources = repository.list_stored_sources("uploaded")
    return [_reconcile_processing_status(source) for source in sources]


def _resume_embed(filename: str, path: Path) -> None:
    try:
        _embed_file(filename, path)
    finally:
        _resuming_embeds.discard(filename)


def _reconcile_processing_status(source: LogSource) -> LogSource:
    if source.status != "processing":
        return source
    if source.filename in _embedding_files:
        return source
    if not is_openai_configured():
        repository.update_source_status(source.filename, "ready")
        return source.model_copy(update={"status": "ready"})

    path = _upload_path(source.filename)
    if path.is_file() and source.filename not in _resuming_embeds:
        _resuming_embeds.add(source.filename)
        threading.Thread(target=_resume_embed, args=(source.filename, path), daemon=True).start()
    return source


def list_all_sources() -> list[LogSource]:
    return list_uploaded_sources()


def _source_path(source: LogSource) -> Path | None:
    path = _upload_path(source.filename)
    return path if path.is_file() else None


def ingest_filenames(filenames: list[str]) -> IngestResponse:
    started = time.perf_counter()
    sources_by_name = {source.filename: source for source in list_all_sources()}
    selected = filenames or list(sources_by_name.keys())

    if not selected:
        return IngestResponse(
            message="No uploaded log files to ingest. Upload .log files first.",
            parsed=0,
            errors=0,
            tenants=[],
            duration_ms=1,
        )

    parsed = 0
    errors = 0
    embedded = 0
    tenants: set[str] = set()
    ingested_at = _now_iso()

    for filename in selected:
        source = sources_by_name.get(filename)
        if not source:
            continue

        path = _source_path(source)
        if not path:
            errors += 1
            continue

        updated = source.model_copy(update={"last_ingested": ingested_at, "status": "ready"})
        file_parsed, file_errors, file_tenants, file_embedded = _index_file(path, updated)
        parsed += file_parsed
        errors += file_errors
        embedded += file_embedded
        tenants.update(file_tenants)

    duration_ms = int((time.perf_counter() - started) * 1000)
    index_note = (
        f"Ingested {len(selected)} file(s) into SQLite"
        + (f" and embedded {embedded} ERROR/WARN lines in Chroma." if embedded else ".")
    )
    if is_openai_configured() and embedded == 0 and parsed > 0:
        index_note += " (Chroma indexing skipped — no ERROR/WARN lines or embedding failure.)"
    elif not is_openai_configured():
        index_note += " Set OPENAI_API_KEY to enable semantic indexing."

    return IngestResponse(
        message=index_note,
        parsed=parsed,
        errors=errors,
        tenants=sorted(tenants),
        duration_ms=max(duration_ms, 1),
    )


async def upload_log_files(
    files: list[UploadFile],
    background_tasks: BackgroundTasks | None = None,
) -> tuple[list[LogSource], int, bool]:
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    upload_dir = _resolve_upload_dir()
    upload_dir.mkdir(parents=True, exist_ok=True)

    started = time.perf_counter()
    uploaded: list[LogSource] = []
    schedule_embeddings = background_tasks is not None and is_openai_configured()

    for file in files:
        filename = Path(file.filename or "").name
        if not filename:
            raise HTTPException(status_code=400, detail="Each upload must include a filename.")
        if not filename.lower().endswith(".log"):
            raise HTTPException(status_code=400, detail=f"Only .log files are supported ({filename}).")

        dest = upload_dir / filename
        content = await file.read()
        if not content.strip():
            raise HTTPException(status_code=400, detail=f"File is empty ({filename}).")

        dest.write_bytes(content)
        ingested_at = _now_iso()
        entries, stats = parse_log_entries(dest)
        parse_ok = stats.parsed_lines > 0
        embed_async = schedule_embeddings and parse_ok

        if not parse_ok:
            status = "error"
        elif embed_async:
            status = "processing"
        else:
            status = "ready"

        source = _build_source_from_parse(filename, stats, status=status, ingested_at=ingested_at)
        repository.persist_parsed_file(source, entries, stats)

        if embed_async and background_tasks is not None:
            get_vector_store().delete_source(filename)
            background_tasks.add_task(_embed_file, filename, dest)
        elif parse_ok and is_openai_configured():
            _embed_file(filename, dest)
            source = source.model_copy(update={"status": "ready"})

        uploaded.append(source)

    duration_ms = int((time.perf_counter() - started) * 1000)
    return uploaded, max(duration_ms, 1), schedule_embeddings


def delete_uploaded_source(filename: str) -> tuple[int, int]:
    safe_name = Path(filename).name
    if not safe_name or safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if not safe_name.lower().endswith(".log"):
        raise HTTPException(status_code=400, detail="Only .log files can be deleted.")
    if not _source_exists(safe_name):
        raise HTTPException(status_code=404, detail=f"File not found ({safe_name}).")

    vectors_removed = get_vector_store().delete_source(safe_name)
    events_removed = repository.delete_source(safe_name)

    file_path = _upload_path(safe_name)
    if file_path.is_file():
        file_path.unlink()

    return events_removed, vectors_removed
