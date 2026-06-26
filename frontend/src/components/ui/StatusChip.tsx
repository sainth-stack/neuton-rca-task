import { Chip } from "@mui/material";

import type { LogSource } from "@/types";

import { statusChipColors, type StatusChipVariant } from "@/lib/theme";

type StatusChipProps = {
  label: string;
  variant?: StatusChipVariant;
};

const dottedVariants = new Set<StatusChipVariant>(["running", "active", "qualified", "failed", "warning", "success"]);

export default function StatusChip({ label, variant = "inactive" }: StatusChipProps) {
  const styles = statusChipColors[variant];
  const showDot = dottedVariants.has(variant) && "dot" in styles && styles.dot;

  return (
    <Chip
      label={
        showDot ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: styles.dot,
                flexShrink: 0,
              }}
            />
            {label}
          </span>
        ) : (
          label
        )
      }
      size="small"
      sx={{
        bgcolor: styles.bg,
        color: styles.color,
        fontWeight: 500,
        fontSize: "0.75rem",
        height: 24,
        borderRadius: 999,
        border: "none",
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
}

export function getLogLevelVariant(level: string): StatusChipVariant {
  switch (level.toUpperCase()) {
    case "ERROR":
      return "failed";
    case "WARN":
      return "warning";
    case "INFO":
      return "qualified";
    default:
      return "inactive";
  }
}

export function getRoleVariant(role?: string): StatusChipVariant {
  switch (role) {
    case "trigger":
      return "failed";
    case "symptom":
      return "warning";
    case "context":
      return "inactive";
    default:
      return "draft";
  }
}

export function getSourceStatusVariant(status: LogSource["status"]): StatusChipVariant {
  switch (status) {
    case "processing":
      return "running";
    case "ready":
      return "success";
    case "error":
      return "failed";
    case "pending":
    default:
      return "warning";
  }
}

export function getSourceStatusLabel(status: LogSource["status"]): string {
  switch (status) {
    case "processing":
      return "Processing in progress";
    case "ready":
      return "Ready";
    case "error":
      return "Error";
    case "pending":
    default:
      return "Pending";
  }
}
