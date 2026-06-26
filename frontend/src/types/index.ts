export type LogRole = "trigger" | "symptom" | "context";

export type LogEvent = {
  logId: string;
  sourceFile: string;
  timestamp: string;
  tenantId: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  logger: string;
  message: string;
  httpStatus?: number;
  role?: LogRole;
  stackTrace?: string[];
};

export type LogSource = {
  filename: string;
  lines: number;
  tenants: string[];
  status: "ready" | "pending" | "processing" | "error";
  lastIngested?: string;
  sourceType?: "uploaded";
  description?: string;
};

export type InvestigationResult = {
  id: string;
  query: string;
  tenantId: string;
  rootCause: string;
  summary: string;
  triggers: string[];
  symptoms: string[];
  evidence: LogEvent[];
  agentSteps: string[];
  createdAt: string;
  scenario: "pool-timeout" | "noise-demux";
};

export type DashboardStat = {
  title: string;
  value: string | number;
  helperText?: string;
};
