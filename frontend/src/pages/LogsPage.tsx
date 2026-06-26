import { useCallback, useEffect, useMemo, useState } from "react";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import { Alert, Box, Chip, LinearProgress, Typography } from "@mui/material";

import LogDetailPanel from "@/components/logs/LogDetailPanel";
import LogExplorerTable from "@/components/logs/LogExplorerTable";
import { AppCard, PageHeader, SearchFilterBar } from "@/components/ui";
import { fetchLogEventPage } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { LogEvent } from "@/types";

export default function LogsPage() {
  const [tenant, setTenant] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LogEvent | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<LogEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLogEventPage({
        tenant: tenant === "ALL" ? undefined : tenant,
        level: level === "ALL" ? undefined : level,
        source: source === "ALL" ? undefined : source,
        search: search.trim() || undefined,
        page,
        pageSize,
      });
      setRows(result.items);
      setTotal(result.total);
      setTenants(result.tenants);
      setSources(result.sources);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tenant, level, source, search, page, pageSize]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    setPage(0);
  }, [tenant, level, source, search]);

  useEffect(() => {
    if (rows.length === 0) {
      setSelected(null);
      return;
    }
    setSelected((current) => {
      if (current && rows.some((row) => row.logId === current.logId)) {
        return current;
      }
      return rows[0];
    });
  }, [rows]);

  const tenantOptions = useMemo(() => ["ALL", ...tenants], [tenants]);
  const sourceOptions = useMemo(() => ["ALL", ...sources], [sources]);

  const activeFilters =
    (tenant !== "ALL" ? 1 : 0) + (level !== "ALL" ? 1 : 0) + (source !== "ALL" ? 1 : 0) + (search.trim() ? 1 : 0);

  return (
    <Box>
      <PageHeader
        eyebrow="Evidence"
        title="Log Explorer"
        subtitle="Browse indexed events with tenant-scoped structural filters — the same retrieval path used by the RCA agent."
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <AppCard padding="md">
        <SearchFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search message, logger, or log_id"
          filters={[
            {
              id: "source",
              label: "Source",
              value: source,
              minWidth: 220,
              options: sourceOptions.map((value) => ({ value, label: value === "ALL" ? "All sources" : value })),
              onChange: setSource,
            },
            {
              id: "tenant",
              label: "Tenant",
              value: tenant,
              options: tenantOptions.map((value) => ({ value, label: value === "ALL" ? "All tenants" : value })),
              onChange: setTenant,
            },
            {
              id: "level",
              label: "Level",
              value: level,
              options: ["ALL", "ERROR", "WARN", "INFO", "DEBUG"].map((value) => ({
                value,
                label: value === "ALL" ? "All levels" : value,
              })),
              onChange: setLevel,
            },
          ]}
          rightSlot={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip
                size="small"
                icon={<FilterListOutlinedIcon sx={{ fontSize: "16px !important" }} />}
                label={`${total.toLocaleString()} events`}
                sx={{ bgcolor: colors.primaryLight, color: colors.primaryDark, fontWeight: 600 }}
              />
              {activeFilters > 0 ? (
                <Chip
                  size="small"
                  label={`${activeFilters} filter${activeFilters > 1 ? "s" : ""} active`}
                  variant="outlined"
                  sx={{ borderColor: colors.border, color: colors.textSecondary }}
                />
              ) : null}
            </Box>
          }
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Live data from SQLite · {total.toLocaleString()} indexed lines
        </Typography>
      </AppCard>

      {loading ? (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
        </Box>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          mt: 2,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.4fr) minmax(320px, 0.8fr)" },
        }}
      >
        <LogExplorerTable
          rows={rows}
          selectedId={selected?.logId}
          onSelect={setSelected}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          totalRows={total}
        />

        <Box sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
          <LogDetailPanel event={selected} />
        </Box>
      </Box>
    </Box>
  );
}
