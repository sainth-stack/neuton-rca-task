import { Box, List, ListItem, ListItemText, Typography } from "@mui/material";

import AppCard from "@/components/ui/AppCard";
import StatusChip from "@/components/ui/StatusChip";
import { colors } from "@/lib/theme";
import type { InvestigationResult } from "@/types";

type InvestigationResultPanelProps = {
  result: InvestigationResult;
};

function BulletList({ title, items, tone }: { title: string; items: string[]; tone?: "error" | "warning" }) {
  return (
    <AppCard title={title} padding="sm">
      <List dense disablePadding>
        {items.map((item) => (
          <ListItem key={item} disableGutters sx={{ alignItems: "flex-start", py: 0.75 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                mt: 0.9,
                mr: 1.25,
                flexShrink: 0,
                bgcolor: tone === "error" ? colors.error : tone === "warning" ? colors.warning : colors.primary,
              }}
            />
            <ListItemText primary={item} primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} />
          </ListItem>
        ))}
      </List>
    </AppCard>
  );
}

export default function InvestigationResultPanel({ result }: InvestigationResultPanelProps) {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <AppCard
        title="Root cause"
        subtitle={`Tenant ${result.tenantId}`}
        action={<StatusChip label="Cited evidence" variant="success" />}
        padding="md"
      >
        <Typography sx={{ fontWeight: 600, color: colors.textPrimary, mb: 1 }}>{result.rootCause}</Typography>
        <Typography variant="body2" color="text.secondary">
          {result.summary}
        </Typography>
      </AppCard>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <BulletList title="Triggers (initiators)" items={result.triggers} tone="error" />
        <BulletList title="Symptoms (downstream)" items={result.symptoms} tone="warning" />
      </Box>
    </Box>
  );
}
