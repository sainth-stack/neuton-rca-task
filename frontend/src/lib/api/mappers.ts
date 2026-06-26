import type { InvestigationResult, LogEvent, LogSource } from "@/types";

import type {
  ApiDeleteSourceResponse,
  ApiEvidenceItem,
  ApiIngestResponse,
  ApiInvestigateResponse,
  ApiLogEvent,
  ApiLogSource,
  ApiLogsListResponse,
  ApiUploadResponse,
} from "./types";

export function mapLogSource(source: ApiLogSource): LogSource {
  return {
    filename: source.filename,
    lines: source.lines,
    tenants: source.tenants,
    status: source.status,
    lastIngested: source.last_ingested ?? undefined,
    sourceType: source.source_type ?? "uploaded",
    description: source.description ?? undefined,
  };
}

export function mapUploadResponse(data: ApiUploadResponse) {
  return {
    message: data.message,
    uploaded: data.uploaded.map(mapLogSource),
    durationMs: data.duration_ms,
  };
}

export function mapIngestResponse(data: ApiIngestResponse) {
  return {
    message: data.message,
    parsed: data.parsed,
    errors: data.errors,
    tenants: data.tenants,
    durationMs: data.duration_ms,
  };
}

export function mapDeleteSourceResponse(data: ApiDeleteSourceResponse) {
  return {
    message: data.message,
    filename: data.filename,
    eventsRemoved: data.events_removed,
    vectorsRemoved: data.vectors_removed,
  };
}

export function mapInvestigateResponse(data: ApiInvestigateResponse): InvestigationResult {
  const normalized = data.query.toLowerCase();
  const scenario =
    normalized.includes("tenant-z") || normalized.includes("tenant z") || normalized.includes("authentication")
      ? "noise-demux"
      : "pool-timeout";
  const tenantId = data.evidence[0]?.tenant_id ?? "UNKNOWN";

  return {
    id: `inv-${Date.now()}`,
    query: data.query,
    tenantId,
    rootCause: data.root_cause,
    summary: data.summary,
    triggers: data.triggers,
    symptoms: data.symptoms,
    evidence: data.evidence.map(mapEvidenceItem),
    agentSteps: data.agent_steps,
    createdAt: new Date().toISOString(),
    scenario,
  };
}

function mapEvidenceItem(item: ApiEvidenceItem): LogEvent {
  return mapLogEvent({
    log_id: item.log_id,
    source_file: item.source_file ?? item.log_id.split(":")[0] ?? "unknown.log",
    timestamp: item.timestamp,
    tenant_id: item.tenant_id,
    level: item.level,
    logger: item.logger ?? "unknown",
    message: item.message,
    http_status: item.http_status,
    stack_trace: item.stack_trace,
    role: item.role,
  });
}

export function mapLogEvent(item: ApiLogEvent & { role?: ApiEvidenceItem["role"] }): LogEvent {
  return {
    logId: item.log_id,
    sourceFile: item.source_file,
    timestamp: item.timestamp,
    tenantId: item.tenant_id,
    level: item.level as LogEvent["level"],
    logger: item.logger,
    message: item.message,
    httpStatus: item.http_status ?? undefined,
    stackTrace: item.stack_trace?.length ? item.stack_trace : undefined,
    role: item.role,
  };
}

export function mapLogsListResponse(data: ApiLogsListResponse) {
  return {
    total: data.total,
    items: data.items.map(mapLogEvent),
    tenants: data.tenants,
    sources: data.sources,
  };
}

export type DeleteResult = ReturnType<typeof mapDeleteSourceResponse>;
export type UploadResult = ReturnType<typeof mapUploadResponse>;
export type IngestResult = ReturnType<typeof mapIngestResponse>;
export type InvestigateResult = ReturnType<typeof mapInvestigateResponse>;
