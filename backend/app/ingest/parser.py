from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

LOG_LINE_PATTERN = re.compile(
    r"^(?P<ts>\S+)\s+\[(?P<tenant>[^\]]+)\]\s+(?P<level>\w+)\s+\[(?P<logger>[^\]]+)\]\s+(?P<message>.*)$"
)
STACK_LINE_PATTERN = re.compile(r"^\s+at\s+")
HTTP_STATUS_PATTERN = re.compile(r"Status:\s*(\d{3})")


@dataclass
class ParseStats:
    filename: str
    total_lines: int = 0
    parsed_lines: int = 0
    unparsed_lines: int = 0
    stack_lines: int = 0
    tenants: set[str] = field(default_factory=set)
    error_warn_count: int = 0


@dataclass
class LogEntry:
    line_number: int
    timestamp: str
    tenant_id: str
    level: str
    logger: str
    message: str
    source_filename: str = ""
    http_status: int | None = None
    stack_trace: list[str] = field(default_factory=list)

    @property
    def log_id(self) -> str:
        return f"{self.source_filename}:{self.line_number}"


def _extract_http_status(message: str) -> int | None:
    match = HTTP_STATUS_PATTERN.search(message)
    return int(match.group(1)) if match else None


def parse_log_file(path: Path) -> ParseStats:
    _, stats = parse_log_entries(path)
    return stats


def parse_log_entries(path: Path) -> tuple[list[LogEntry], ParseStats]:
    stats = ParseStats(filename=path.name)
    entries: list[LogEntry] = []
    current: LogEntry | None = None

    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line_number, line in enumerate(handle, start=1):
            stats.total_lines += 1
            stripped = line.rstrip("\n")

            if STACK_LINE_PATTERN.match(stripped):
                stats.stack_lines += 1
                if current is not None:
                    current.stack_trace.append(stripped.strip())
                continue

            match = LOG_LINE_PATTERN.match(stripped)
            if not match:
                stats.unparsed_lines += 1
                continue

            if current is not None:
                entries.append(current)

            tenant = match.group("tenant")
            level = match.group("level").upper()
            message = match.group("message")

            stats.parsed_lines += 1
            stats.tenants.add(tenant)
            if level in {"ERROR", "WARN"}:
                stats.error_warn_count += 1

            current = LogEntry(
                line_number=line_number,
                timestamp=match.group("ts"),
                tenant_id=tenant,
                level=level,
                logger=match.group("logger"),
                message=message,
                http_status=_extract_http_status(message),
                source_filename=path.name,
            )

    if current is not None:
        entries.append(current)

    return entries, stats
