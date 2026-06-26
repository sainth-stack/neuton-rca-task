import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";

import { displayFont, surfaceSx } from "@/lib/theme";

type AppCardProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = { none: 0, sm: 1.5, md: 2, lg: 3 };

export default function AppCard({ title, subtitle, action, children, padding = "md" }: AppCardProps) {
  const pad = paddingMap[padding];
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <Paper variant="outlined" sx={{ ...surfaceSx, overflow: "hidden" }}>
      {hasHeader ? (
        <Box
          sx={{
            px: pad || 2,
            pt: 1.5,
            pb: 1.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box>
            {title ? (
              <Typography sx={{ fontFamily: displayFont, fontWeight: 600, fontSize: "0.9375rem" }}>{title}</Typography>
            ) : null}
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action}
        </Box>
      ) : null}
      <Box sx={{ p: pad }}>{children}</Box>
    </Paper>
  );
}
