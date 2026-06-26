import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import { Alert, Box, LinearProgress, Typography } from "@mui/material";

import { AppButton, AppCard, MetricGrid, PageHeader, StatCard } from "@/components/ui";
import { checkHealth } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    indexedEvents: 0,
    indexedTenants: 0,
    errorWarnEvents: 0,
    uploadedSources: 0,
    openaiConfigured: false,
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      try {
        const health = await checkHealth();
        if (!active) return;
        setStats({
          indexedEvents: health.indexed_events ?? 0,
          indexedTenants: health.indexed_tenants ?? 0,
          errorWarnEvents: health.error_warn_events ?? 0,
          uploadedSources: health.uploaded_sources ?? 0,
          openaiConfigured: health.openai_configured ?? false,
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard stats.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const hasData = stats.indexedEvents > 0;

  return (
    <Box>
      <PageHeader
        eyebrow="RCA Engine"
        title="Dashboard"
        subtitle="Log intelligence platform for multi-tenant outage diagnosis."
        primaryAction={
          <AppButton onClick={() => navigate(hasData ? "/investigate" : "/ingest")} disabled={loading}>
            {hasData ? "Run RCA query" : "Upload logs"}
          </AppButton>
        }
        secondaryAction={
          hasData ? (
            <AppButton variant="secondary" onClick={() => navigate("/ingest")}>
              Upload more logs
            </AppButton>
          ) : undefined
        }
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      ) : null}

      <MetricGrid>
        <StatCard
          title="Parsed log lines"
          value={stats.indexedEvents.toLocaleString()}
          helperText={
            stats.uploadedSources > 0
              ? `Across ${stats.uploadedSources} uploaded file${stats.uploadedSources === 1 ? "" : "s"}`
              : "Upload .log files to get started"
          }
          icon={StorageOutlinedIcon}
        />
        <StatCard
          title="Indexed tenants"
          value={stats.indexedTenants}
          helperText={stats.indexedTenants > 0 ? "From uploaded logs" : "Tenants appear after ingest"}
          icon={CloudUploadOutlinedIcon}
        />
        <StatCard
          title="ERROR / WARN events"
          value={stats.errorWarnEvents.toLocaleString()}
          helperText="Eligible for RCA retrieval"
          icon={PsychologyOutlinedIcon}
        />
        <StatCard
          title="OpenAI indexing"
          value={stats.openaiConfigured ? "Ready" : "Off"}
          helperText={
            stats.openaiConfigured
              ? "Embeddings + agent synthesis enabled"
              : "Set OPENAI_API_KEY in backend .env"
          }
          icon={SearchOutlinedIcon}
        />
      </MetricGrid>

      {!hasData && !loading ? (
        <Box sx={{ mt: 2 }}>
          <AppCard title="Get started" padding="md">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This workspace starts empty. Upload your `.log` files first — they are parsed into SQLite and indexed for
              semantic search. Then run an RCA query or browse events in the log explorer.
            </Typography>
            <AppButton onClick={() => navigate("/ingest")}>Go to Data Ingest</AppButton>
          </AppCard>
        </Box>
      ) : null}

      <Box sx={{ mt: 2 }}>
        <AppCard title="Workflow" padding="md">
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" } }}>
            {[
              { step: "1", title: "Ingest", body: "Upload .log files → parse into SQLite + vector index", href: "/ingest" },
              { step: "2", title: "Query", body: "Natural language RCA with cited evidence", href: "/investigate" },
              { step: "3", title: "Explore", body: "Filter logs by tenant, level, time", href: "/logs" },
            ].map((item) => (
              <Box
                key={item.step}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${colors.border}`,
                  bgcolor: colors.surfaceTint,
                }}
              >
                <Typography sx={{ fontWeight: 700, color: colors.primary, mb: 0.5 }}>
                  {item.step}. {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {item.body}
                </Typography>
                <AppButton variant="ghost" size="small" onClick={() => navigate(item.href)}>
                  Go to screen
                </AppButton>
              </Box>
            ))}
          </Box>
        </AppCard>
      </Box>
    </Box>
  );
}
