/** Raw API shapes (snake_case) — mirrors backend Pydantic models. */

export type ApiLogSource = {
  filename: string;
  lines: number;
  tenants: string[];
  status: "ready" | "pending" | "processing" | "error";
  last_ingested?: string | null;
  source_type?: "uploaded";
  description?: string | null;
};

export type ApiHealthResponse = {
  status: string;
  version: string;
  service: string;
  openai_configured?: boolean;
  indexed_events?: number;
  indexed_tenants?: number;
  error_warn_events?: number;
  uploaded_sources?: number;
};

export type ApiUploadResponse = {
  message: string;
  uploaded: ApiLogSource[];
  duration_ms: number;
};

export type ApiDeleteSourceResponse = {
  message: string;
  filename: string;
  events_removed: number;
  vectors_removed: number;
};

export type ApiIngestResponse = {
  message: string;
  parsed: number;
  errors: number;
  tenants: string[];
  duration_ms: number;
};

export type ApiIngestRequest = {
  filenames?: string[];
};

export type ApiEvidenceItem = {
  log_id: string;
  timestamp: string;
  tenant_id: string;
  level: string;
  message: string;
  role: "trigger" | "symptom" | "context";
  source_file?: string | null;
  logger?: string | null;
  http_status?: number | null;
  stack_trace?: string[];
};

export type ApiLogEvent = {
  log_id: string;
  source_file: string;
  timestamp: string;
  tenant_id: string;
  level: string;
  logger: string;
  message: string;
  http_status?: number | null;
  stack_trace?: string[];
};

export type ApiLogsListResponse = {
  total: number;
  items: ApiLogEvent[];
  tenants: string[];
  sources: string[];
};

export type ApiInvestigateRequest = {
  query: string;
  sources?: string[];
};

export type ApiInvestigateResponse = {
  query: string;
  root_cause: string;
  summary: string;
  triggers: string[];
  symptoms: string[];
  evidence: ApiEvidenceItem[];
  agent_steps: string[];
};

export type ListSourcesParams = {
  scope?: "uploaded";
};
