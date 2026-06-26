from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
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

    status: str
    version: str
    service: str
    openai_configured: bool = False
    indexed_events: int = 0
    indexed_tenants: int = 0
    error_warn_events: int = 0
    uploaded_sources: int = 0


class LogSource(BaseModel):
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

    filename: str
    lines: int
    tenants: list[str]
    status: Literal["ready", "pending", "processing", "error"]
    last_ingested: Optional[str] = None
    source_type: Literal["uploaded"] = "uploaded"
    description: Optional[str] = None


class DeleteSourceResponse(BaseModel):
    message: str
    filename: str
    events_removed: int
    vectors_removed: int


class UploadResponse(BaseModel):
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

    message: str
    uploaded: list[LogSource]
    duration_ms: int


class IngestRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={"example": {"filenames": ["production_incident_01.log"]}})

    filenames: list[str] = Field(default_factory=list)


class IngestResponse(BaseModel):
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
    parsed: int
    errors: int
    tenants: list[str]
    duration_ms: int


class EvidenceItem(BaseModel):
    log_id: str
    timestamp: str
    tenant_id: str
    level: str
    message: str
    role: Literal["trigger", "symptom", "context"]
    source_file: Optional[str] = None
    logger: Optional[str] = None
    http_status: Optional[int] = None
    stack_trace: list[str] = Field(default_factory=list)


class InvestigateRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "What caused the 503 errors for TENANT-X?",
                "sources": [],
            }
        }
    )

    query: str
    sources: list[str] = Field(default_factory=list)


class InvestigateResponse(BaseModel):
    query: str
    root_cause: str
    summary: str
    triggers: list[str]
    symptoms: list[str]
    evidence: list[EvidenceItem]
    agent_steps: list[str]


class LogEventResponse(BaseModel):
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
    total: int
    items: list[LogEventResponse]
    tenants: list[str]
    sources: list[str]
