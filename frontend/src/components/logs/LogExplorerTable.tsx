import type { ReactNode } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";

import EmptyState from "@/components/ui/EmptyState";
import StatusChip, { getLogLevelVariant, getRoleVariant } from "@/components/ui/StatusChip";
import { formatLogTimestamp, shortLogId } from "@/lib/format";
import { colors, tableCellPadding, tableSurfaceSx } from "@/lib/theme";
import type { LogEvent } from "@/types";

const headCellSx = {
  fontWeight: 600,
  fontSize: "0.75rem",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  color: colors.textSecondary,
  bgcolor: colors.tableHeader,
  borderBottom: `1px solid ${colors.border}`,
  whiteSpace: "nowrap" as const,
  ...tableCellPadding.head,
};

const bodyCellSx = {
  fontSize: "0.8125rem",
  color: colors.textPrimary,
  borderBottom: `1px solid ${colors.border}`,
  verticalAlign: "middle" as const,
  ...tableCellPadding.body,
};

function TablePrimaryText({ children }: { children: ReactNode }) {
  return (
    <Typography component="span" sx={{ display: "block", fontWeight: 500, color: colors.textPrimary, fontSize: "0.8125rem" }}>
      {children}
    </Typography>
  );
}

function TableSecondaryText({ children }: { children: ReactNode }) {
  return (
    <Typography component="span" sx={{ display: "block", color: colors.textSecondary, fontSize: "0.75rem", mt: 0.25 }}>
      {children}
    </Typography>
  );
}

type LogExplorerTableProps = {
  rows: LogEvent[];
  selectedId?: string;
  onSelect?: (row: LogEvent) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalRows?: number;
};

export default function LogExplorerTable({
  rows,
  selectedId,
  onSelect,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalRows,
}: LogExplorerTableProps) {
  const serverPaginated = totalRows !== undefined;
  const pagedRows = serverPaginated ? rows : rows.slice(page * pageSize, page * pageSize + pageSize);
  const rowCount = serverPaginated ? totalRows : rows.length;

  if (rows.length === 0) {
    return (
      <Paper variant="outlined" sx={tableSurfaceSx}>
        <EmptyState
          title="No log events match your filters"
          description="Try clearing search text or selecting ALL for tenant and level."
        />
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={tableSurfaceSx}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={headCellSx}>Log event</TableCell>
              <TableCell sx={headCellSx}>Timestamp</TableCell>
              <TableCell sx={headCellSx}>Tenant</TableCell>
              <TableCell sx={headCellSx}>Level</TableCell>
              <TableCell sx={headCellSx}>Role</TableCell>
              <TableCell sx={headCellSx}>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedRows.map((row) => {
              const selected = selectedId === row.logId;
              return (
                <TableRow
                  key={row.logId}
                  hover
                  selected={selected}
                  onClick={() => onSelect?.(row)}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.12s ease",
                    "&:last-child td": { borderBottom: 0 },
                    "&.Mui-selected": {
                      bgcolor: `${colors.primaryLight} !important`,
                      "&:hover": { bgcolor: `${colors.primaryLight} !important` },
                    },
                    "&:hover": { bgcolor: colors.navHover },
                  }}
                >
                  <TableCell sx={bodyCellSx}>
                    <TablePrimaryText>{shortLogId(row.logId)}</TablePrimaryText>
                    <TableSecondaryText>{row.sourceFile}</TableSecondaryText>
                  </TableCell>
                  <TableCell sx={{ ...bodyCellSx, whiteSpace: "nowrap", color: colors.textSecondary }}>
                    {formatLogTimestamp(row.timestamp)}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <TablePrimaryText>{row.tenantId}</TablePrimaryText>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <StatusChip label={row.level} variant={getLogLevelVariant(row.level)} />
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    {row.role ? <StatusChip label={row.role} variant={getRoleVariant(row.role)} /> : "—"}
                  </TableCell>
                  <TableCell sx={{ ...bodyCellSx, maxWidth: 360 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        color: colors.textSecondary,
                        lineHeight: 1.45,
                      }}
                      title={row.message}
                    >
                      {row.message}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rowCount}
        page={page}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          onPageSizeChange(parseInt(event.target.value, 10));
          onPageChange(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{
          borderTop: `1px solid ${colors.border}`,
          "& .MuiTablePagination-toolbar": { minHeight: 52 },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: "0.8125rem",
            color: colors.textSecondary,
          },
        }}
      />
    </Paper>
  );
}
