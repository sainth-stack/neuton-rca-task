from __future__ import annotations

import sqlite3
from pathlib import Path

from app.config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS log_sources (
    filename TEXT PRIMARY KEY,
    lines INTEGER NOT NULL,
    tenants TEXT NOT NULL,
    status TEXT NOT NULL,
    last_ingested TEXT,
    source_type TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS log_events (
    log_id TEXT PRIMARY KEY,
    source_file TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    level TEXT NOT NULL,
    logger TEXT NOT NULL,
    message TEXT NOT NULL,
    http_status INTEGER,
    stack_trace TEXT,
    FOREIGN KEY (source_file) REFERENCES log_sources(filename) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_log_events_tenant ON log_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_log_events_level ON log_events(level);
CREATE INDEX IF NOT EXISTS idx_log_events_source ON log_events(source_file);
CREATE INDEX IF NOT EXISTS idx_log_events_timestamp ON log_events(timestamp);
"""


def resolve_sqlite_path() -> Path:
    path = Path(get_settings().sqlite_path)
    if not path.is_absolute():
        path = Path.cwd() / path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path.resolve()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(resolve_sqlite_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(SCHEMA)


def count_events() -> int:
    with get_connection() as conn:
        row = conn.execute("SELECT COUNT(*) AS total FROM log_events").fetchone()
        return int(row["total"]) if row else 0
