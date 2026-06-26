import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { Box, Divider, IconButton, Tooltip, Typography } from "@mui/material";

import AppCard from "@/components/ui/AppCard";
import StatusChip, { getLogLevelVariant, getRoleVariant } from "@/components/ui/StatusChip";
import { formatLogTimestamp } from "@/lib/format";
import { colors, displayFont, surfaceSx } from "@/lib/theme";
import type { LogEvent } from "@/types";

type LogDetailPanelProps = {
  event: LogEvent | null;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "108px 1fr", gap: 1.5, py: 0.75 }}>
      <Typography variant="caption" sx={{ color: colors.textMuted, fontWeight: 600, pt: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: colors.textPrimary, wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function LogDetailPanel({ event }: LogDetailPanelProps) {
  if (!event) {
    return (
      <AppCard title="Event detail" subtitle="Select a row to inspect lineage">
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Choose a log event from the table to view metadata, raw text, and stack trace.
          </Typography>
        </Box>
      </AppCard>
    );
  }

  const rawText = [
    `${event.timestamp} [${event.tenantId}] ${event.level} [${event.logger}] ${event.message}`,
    ...(event.stackTrace ?? []),
  ].join("\n");

  const copyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
    } catch {
      // Clipboard may be unavailable in non-secure contexts.
    }
  };

  return (
    <AppCard
      title="Event detail"
      subtitle={event.logId}
      action={
        <Tooltip title="Copy raw log">
          <IconButton size="small" onClick={copyRaw} sx={{ color: colors.textSecondary }}>
            <ContentCopyOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <StatusChip label={event.level} variant={getLogLevelVariant(event.level)} />
        {event.role ? <StatusChip label={event.role} variant={getRoleVariant(event.role)} /> : null}
        {event.httpStatus ? <StatusChip label={`HTTP ${event.httpStatus}`} variant="qualified" /> : null}
      </Box>

      <Box sx={{ mb: 2 }}>
        <DetailRow label="Timestamp" value={formatLogTimestamp(event.timestamp)} />
        <DetailRow label="Tenant" value={event.tenantId} />
        <DetailRow label="Source file" value={event.sourceFile} />
        <DetailRow label="Logger" value={event.logger} />
        {event.httpStatus ? <DetailRow label="HTTP status" value={String(event.httpStatus)} /> : null}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography
        sx={{
          fontFamily: displayFont,
          fontWeight: 600,
          fontSize: "0.8125rem",
          mb: 1,
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Raw record
      </Typography>
      <Box
        component="pre"
        sx={{
          ...surfaceSx,
          m: 0,
          p: 2,
          bgcolor: colors.background,
          borderRadius: 2,
          fontSize: "0.75rem",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 320,
          overflow: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        }}
      >
        {rawText}
      </Box>
    </AppCard>
  );
}
