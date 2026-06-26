from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    """Health check payload."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "ok",
                "version": "0.1.0",
                "service": "Neuron7 RCA Engine",
                "openai_configured": True,
                "indexed_events": 0,
                "indexed_tenants": 0,
                "error_warn_events": 0,
                "uploaded_sources": 0,
            }
        }
    )

    status: str = Field(description="Service status, typically `ok`.")
    version: str = Field(description="API version string.")
    service: str = Field(description="Human-readable service name.")
    openai_configured: bool = Field(default=False, description="Whether OPENAI_API_KEY is set.")
    indexed_events: int = Field(default=0, description="Number of log lines stored in SQLite.")
    indexed_tenants: int = Field(default=0, description="Distinct tenant IDs in the index.")
    error_warn_events: int = Field(default=0, description="ERROR + WARN lines eligible for RCA.")
    uploaded_sources: int = Field(default=0, description="Number of uploaded log files indexed.")


class LogSource(BaseModel):
    """Metadata for one ingested log file."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "filename": "production_incident_01.log",
                "lines": 5003,
                "tenants": ["TENANT-A", "TENANT-X"],
                "status": "ready",
                "last_ingested": "2026-05-26T12:04:34Z",
                "source_type": "uploaded",
                "description": None,
            }
        }
    )

    filename: str = Field(description="Original log file name.")
    lines: int = Field(description="Total line count in the file.")
    tenants: list[str] = Field(description="Tenant IDs found while parsing.")
    status: Literal["ready", "pending", "processing", "error"] = Field(
        description="Parse / ingest status. `processing` = parsed into SQLite, Chroma embedding in progress."
    )
    last_ingested: Optional[str] = Field(default=None, description="ISO-8601 timestamp of last ingest.")
    source_type: Literal["uploaded"] = Field(default="uploaded", description="Where the file came from.")
    description: Optional[str] = Field(default=None, description="Optional short description.")


class DeleteSourceResponse(BaseModel):
    """Result of deleting an uploaded log file."""

    message: str = Field(description="Short human-readable summary.")
    filename: str = Field(description="Deleted log file name.")
    events_removed: int = Field(description="Log lines removed from SQLite.")
    vectors_removed: int = Field(description="Embeddings removed from Chroma.")


class UploadResponse(BaseModel):
    """Result of uploading one or more log files."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Uploaded and parsed 1 log file(s).",
                "uploaded": [
                    {
                        "filename": "production_incident_01.log",
                        "lines": 5003,
                        "tenants": ["TENANT-A", "TENANT-X"],
                        "status": "ready",
                        "last_ingested": "2026-05-26T12:04:34Z",
                        "source_type": "uploaded",
                        "description": None,
                    }
                ],
                "duration_ms": 120,
            }
        }
    )

    message: str = Field(description="Short human-readable summary.")
    uploaded: list[LogSource] = Field(description="Parsed metadata for each uploaded file.")
    duration_ms: int = Field(description="Server-side processing time in milliseconds.")


class IngestRequest(BaseModel):
    """Optional list of filenames to ingest. Empty list ingests all known sources."""

    model_config = ConfigDict(json_schema_extra={"example": {"filenames": ["production_incident_01.log"]}})

    filenames: list[str] = Field(default_factory=list, description="Filenames to parse. Omit to ingest everything.")


class IngestResponse(BaseModel):
    """Result of running the ingest pipeline."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "Ingested 2 file(s) into SQLite and embedded ERROR/WARN lines in Chroma.",
                "parsed": 10005,
                "errors": 12,
                "tenants": ["TENANT-A", "TENANT-X"],
                "duration_ms": 420,
            }
        }
    )

    message: str
    parsed: int = Field(description="Number of successfully parsed log lines.")
    errors: int = Field(description="Number of lines that could not be parsed.")
    tenants: list[str] = Field(description="Unique tenant IDs seen in the selected files.")
    duration_ms: int = Field(description="Server-side processing time in milliseconds.")


class EvidenceItem(BaseModel):
    """One log line cited as RCA evidence."""

    log_id: str = Field(description="Stable id, usually `<filename>:<line>`.")
    timestamp: str = Field(description="ISO-8601 event timestamp.")
    tenant_id: str
    level: str
    message: str
    role: Literal["trigger", "symptom", "context"] = Field(description="How this line relates to the incident.")
    source_file: Optional[str] = Field(default=None, description="Original log filename.")
    logger: Optional[str] = Field(default=None, description="Logger name from the log line.")
    http_status: Optional[int] = Field(default=None, description="HTTP status when present in the message.")
    stack_trace: list[str] = Field(default_factory=list, description="Stack frames attached to the log line.")


class InvestigateRequest(BaseModel):
    """Natural-language RCA query."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "What caused the 503 errors for TENANT-X?",
                "sources": [],
            }
        }
    )

    query: str = Field(description="Question to investigate, e.g. tenant + symptom.")
    sources: list[str] = Field(default_factory=list, description="Optional filenames to restrict retrieval.")


class InvestigateResponse(BaseModel):
    """Structured RCA answer with cited evidence."""

    query: str
    root_cause: str
    summary: str
    triggers: list[str] = Field(description="Upstream events that initiated the failure.")
    symptoms: list[str] = Field(description="Downstream visible effects.")
    evidence: list[EvidenceItem] = Field(description="Log lines supporting the conclusion.")
    agent_steps: list[str] = Field(description="High-level reasoning steps taken by the agent.")


class LogEventResponse(BaseModel):
    """One indexed log line for the explorer."""

    log_id: str
    source_file: str
    timestamp: str
    tenant_id: str
    level: str
    logger: str
    message: str
    http_status: Optional[int] = None
    stack_trace: list[str] = Field(default_factory=list)


class LogsListResponse(BaseModel):
    """Paginated log explorer results."""

    total: int
    items: list[LogEventResponse]
    tenants: list[str] = Field(description="Distinct tenant ids in the index.")
    sources: list[str] = Field(description="Distinct source files in the index.")
