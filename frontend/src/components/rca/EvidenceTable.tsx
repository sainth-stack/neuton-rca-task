import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import StatusChip, { getLogLevelVariant, getRoleVariant } from "@/components/ui/StatusChip";
import { colors, surfaceSx } from "@/lib/theme";
import type { LogEvent } from "@/types";

type EvidenceTableProps = {
  rows: LogEvent[];
  onSelect?: (row: LogEvent) => void;
  selectedId?: string;
};

export default function EvidenceTable({ rows, onSelect, selectedId }: EvidenceTableProps) {
  return (
    <TableContainer component={Box} sx={{ ...surfaceSx, overflow: "hidden" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Log ID</TableCell>
            <TableCell>Timestamp</TableCell>
            <TableCell>Tenant</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const selected = selectedId === row.logId;
            return (
              <TableRow
                key={row.logId}
                hover
                selected={selected}
                onClick={() => onSelect?.(row)}
                sx={{
                  cursor: onSelect ? "pointer" : "default",
                  "&.Mui-selected": { bgcolor: `${colors.primaryLight} !important` },
                }}
              >
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", color: colors.primary }}>
                    {row.logId}
                  </Typography>
                </TableCell>
                <TableCell>{row.timestamp.replace("T", " ").replace("Z", "")}</TableCell>
                <TableCell>{row.tenantId}</TableCell>
                <TableCell>
                  <StatusChip label={row.level} variant={getLogLevelVariant(row.level)} />
                </TableCell>
                <TableCell>
                  {row.role ? <StatusChip label={row.role} variant={getRoleVariant(row.role)} /> : "—"}
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography variant="body2" noWrap title={row.message}>
                    {row.message}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
