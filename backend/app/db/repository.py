from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass

from app.api.schemas import LogSource
from app.db.database import get_connection
from app.ingest.parser import LogEntry, ParseStats


@dataclass
class StoredLogEvent:
    log_id: str
    source_file: str
    line_number: int
    timestamp: str
    tenant_id: str
    level: str
    logger: str
    message: str
    http_status: int | None = None
    stack_trace: list[str] | None = None


def upsert_source(source: LogSource) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO log_sources (filename, lines, tenants, status, last_ingested, source_type, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(filename) DO UPDATE SET
                lines = excluded.lines,
                tenants = excluded.tenants,
                status = excluded.status,
                last_ingested = excluded.last_ingested,
                source_type = excluded.source_type,
                description = excluded.description
            """,
            (
                source.filename,
                source.lines,
                json.dumps(source.tenants),
                source.status,
                source.last_ingested,
                source.source_type,
                source.description,
            ),
        )
        conn.commit()


def replace_events_for_file(filename: str, entries: list[LogEntry]) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM log_events WHERE source_file = ?", (filename,))
        conn.executemany(
            """
            INSERT INTO log_events (
                log_id, source_file, line_number, timestamp, tenant_id,
                level, logger, message, http_status, stack_trace
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    entry.log_id,
                    filename,
                    entry.line_number,
                    entry.timestamp,
                    entry.tenant_id,
                    entry.level,
                    entry.logger,
                    entry.message,
                    entry.http_status,
                    json.dumps(entry.stack_trace) if entry.stack_trace else None,
                )
                for entry in entries
            ],
        )
        conn.commit()


def persist_parsed_file(source: LogSource, entries: list[LogEntry], stats: ParseStats) -> None:
    upsert_source(source)
    replace_events_for_file(source.filename, entries)


def update_source_status(filename: str, status: str, description: str | None = None) -> None:
    with get_connection() as conn:
        if description is not None:
            conn.execute(
                "UPDATE log_sources SET status = ?, description = ? WHERE filename = ?",
                (status, description, filename),
            )
        else:
            conn.execute(
                "UPDATE log_sources SET status = ? WHERE filename = ?",
                (status, filename),
            )
        conn.commit()


def get_stored_source(filename: str) -> LogSource | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM log_sources WHERE filename = ?", (filename,)).fetchone()
    return _row_to_source(row) if row else None


def delete_source(filename: str) -> int:
    with get_connection() as conn:
        count_row = conn.execute(
            "SELECT COUNT(*) AS total FROM log_events WHERE source_file = ?",
            (filename,),
        ).fetchone()
        events_removed = int(count_row["total"]) if count_row else 0
        conn.execute("DELETE FROM log_sources WHERE filename = ?", (filename,))
        conn.commit()
    return events_removed


def list_stored_sources(source_type: str | None = None) -> list[LogSource]:
    query = "SELECT * FROM log_sources"
    params: tuple[str, ...] = ()
    if source_type:
        query += " WHERE source_type = ?"
        params = (source_type,)

    with get_connection() as conn:
        rows = conn.execute(f"{query} ORDER BY last_ingested DESC", params).fetchall()

    return [_row_to_source(row) for row in rows]


def _row_to_source(row: sqlite3.Row) -> LogSource:
    return LogSource(
        filename=row["filename"],
        lines=row["lines"],
        tenants=json.loads(row["tenants"]),
        status=row["status"],
        last_ingested=row["last_ingested"],
        source_type=row["source_type"],
        description=row["description"],
    )


def _row_to_event(row: sqlite3.Row) -> StoredLogEvent:
    stack_trace_raw = row["stack_trace"]
    stack_trace = json.loads(stack_trace_raw) if stack_trace_raw else None
    return StoredLogEvent(
        log_id=row["log_id"],
        source_file=row["source_file"],
        line_number=row["line_number"],
        timestamp=row["timestamp"],
        tenant_id=row["tenant_id"],
        level=row["level"],
        logger=row["logger"],
        message=row["message"],
        http_status=row["http_status"],
        stack_trace=stack_trace,
    )


def query_events(
    *,
    tenant_id: str | None = None,
    level: str | None = None,
    source_file: str | None = None,
    search: str | None = None,
    levels: list[str] | None = None,
    source_files: list[str] | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[StoredLogEvent], int]:
    clauses: list[str] = []
    params: list[object] = []

    if tenant_id and tenant_id != "ALL":
        clauses.append("tenant_id = ?")
        params.append(tenant_id)

    if level and level != "ALL":
        clauses.append("level = ?")
        params.append(level)
    elif levels:
        placeholders = ", ".join("?" for _ in levels)
        clauses.append(f"level IN ({placeholders})")
        params.extend(levels)

    if source_file and source_file != "ALL":
        clauses.append("source_file = ?")
        params.append(source_file)
    elif source_files:
        placeholders = ", ".join("?" for _ in source_files)
        clauses.append(f"source_file IN ({placeholders})")
        params.extend(source_files)

    if search:
        pattern = f"%{search.strip()}%"
        clauses.append("(message LIKE ? OR logger LIKE ? OR log_id LIKE ?)")
        params.extend([pattern, pattern, pattern])

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    with get_connection() as conn:
        total_row = conn.execute(f"SELECT COUNT(*) AS total FROM log_events {where}", params).fetchone()
        rows = conn.execute(
            f"""
            SELECT * FROM log_events
            {where}
            ORDER BY timestamp ASC, line_number ASC
            LIMIT ? OFFSET ?
            """,
            [*params, limit, offset],
        ).fetchall()

    total = int(total_row["total"]) if total_row else 0
    return [_row_to_event(row) for row in rows], total


def get_tenant_events(
    tenant_id: str,
    *,
    levels: list[str] | None = None,
    source_files: list[str] | None = None,
) -> list[StoredLogEvent]:
    events, _ = query_events(
        tenant_id=tenant_id,
        levels=levels or ["ERROR", "WARN"],
        source_files=source_files,
        limit=10_000,
        offset=0,
    )
    return events


def get_distinct_tenants() -> list[str]:
    with get_connection() as conn:
        rows = conn.execute("SELECT DISTINCT tenant_id FROM log_events ORDER BY tenant_id").fetchall()
    return [row["tenant_id"] for row in rows]


def get_distinct_sources() -> list[str]:
    with get_connection() as conn:
        rows = conn.execute("SELECT DISTINCT source_file FROM log_events ORDER BY source_file").fetchall()
    return [row["source_file"] for row in rows]


def get_events_by_ids(log_ids: list[str]) -> list[StoredLogEvent]:
    if not log_ids:
        return []

    placeholders = ", ".join("?" for _ in log_ids)
    with get_connection() as conn:
        rows = conn.execute(
            f"SELECT * FROM log_events WHERE log_id IN ({placeholders}) ORDER BY timestamp ASC, line_number ASC",
            log_ids,
        ).fetchall()
    return [_row_to_event(row) for row in rows]


def count_events(
    *,
    tenant_id: str | None = None,
    level: str | None = None,
) -> int:
    clauses: list[str] = []
    params: list[object] = []

    if tenant_id:
        clauses.append("tenant_id = ?")
        params.append(tenant_id)
    if level:
        clauses.append("level = ?")
        params.append(level)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with get_connection() as conn:
        row = conn.execute(f"SELECT COUNT(*) AS total FROM log_events {where}", params).fetchone()
    return int(row["total"]) if row else 0


def count_all_events() -> int:
    with get_connection() as conn:
        row = conn.execute("SELECT COUNT(*) AS total FROM log_events").fetchone()
    return int(row["total"]) if row else 0
