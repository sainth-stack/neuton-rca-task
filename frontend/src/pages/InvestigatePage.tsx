import { useState } from "react";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Alert, Box, TextField, Typography } from "@mui/material";

import EvidenceTable from "@/components/rca/EvidenceTable";
import InvestigationResultPanel from "@/components/rca/InvestigationResultPanel";
import { AppButton, AppCard, PageHeader } from "@/components/ui";
import { runInvestigation } from "@/lib/api";
import { colors, surfaceSx } from "@/lib/theme";
import type { InvestigationResult, LogEvent } from "@/types";

const EXAMPLE_QUERIES = [
  "What caused the 503 errors for TENANT-X?",
  "Identify failures impacting TENANT-Z during the authentication spike.",
];

export default function InvestigatePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<LogEvent | null>(null);
  const [running, setRunning] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInvestigation = async (queryText: string = query) => {
    if (!queryText.trim()) return;

    setRunning(true);
    setSubmittedQuery(queryText.trim());
    setError(null);

    try {
      const next = await runInvestigation(queryText.trim());
      setResult(next);
      setSelectedEvidence(next.evidence[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investigation failed.");
      setResult(null);
      setSelectedEvidence(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="RCA Query"
        subtitle="Ask a natural language question about an outage. Results include root cause, triggers, symptoms, and cited log evidence."
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <AppCard title="Ask a question" subtitle="Investigation runs against your uploaded and indexed logs">
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Investigation query"
          placeholder="e.g. What caused the 503 errors for TENANT-X?"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              void handleInvestigation();
            }
          }}
          sx={{ mb: 2 }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          Upload logs first on the Ingest page. Include a tenant ID in your question (e.g. TENANT-X).
        </Typography>

        <AppButton leftIcon={<SearchOutlinedIcon />} loading={running} onClick={() => void handleInvestigation()}>
          Analyze
        </AppButton>
      </AppCard>

      {result ? (
        <Box sx={{ display: "grid", gap: 2, mt: 2 }}>
          <AppCard title="Query" padding="sm">
            <Typography variant="body2" color="text.secondary">
              {submittedQuery}
            </Typography>
          </AppCard>

          <InvestigationResultPanel result={result} />

          {result.agentSteps.length > 0 ? (
            <AppCard title="Agent steps" subtitle="Retrieval and reasoning path taken for this investigation">
              <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1 }}>
                {result.agentSteps.map((step) => (
                  <Typography key={step} component="li" variant="body2" color="text.secondary">
                    {step}
                  </Typography>
                ))}
              </Box>
            </AppCard>
          ) : null}

          <AppCard title="Evidence" subtitle="Log lines cited in this analysis — click a row for full detail">
            <EvidenceTable rows={result.evidence} selectedId={selectedEvidence?.logId} onSelect={setSelectedEvidence} />
          </AppCard>

          {selectedEvidence ? (
            <AppCard title="Log detail" subtitle={selectedEvidence.logId}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {selectedEvidence.timestamp} · {selectedEvidence.tenantId} · {selectedEvidence.level}
              </Typography>
              <Box
                component="pre"
                sx={{
                  ...surfaceSx,
                  p: 2,
                  m: 0,
                  bgcolor: colors.background,
                  fontSize: "0.8125rem",
                  whiteSpace: "pre-wrap",
                  overflow: "auto",
                }}
              >
                {selectedEvidence.message}
                {selectedEvidence.stackTrace?.length
                  ? `\n${selectedEvidence.stackTrace.map((line) => `    ${line}`).join("\n")}`
                  : ""}
              </Box>
            </AppCard>
          ) : null}
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <AppCard title="Results" padding="md">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Submit a query above to see root cause, triggers, symptoms, and cited log evidence.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Example questions after upload: {EXAMPLE_QUERIES.join(" · ")}
            </Typography>
          </AppCard>
        </Box>
      )}
    </Box>
  );
}
