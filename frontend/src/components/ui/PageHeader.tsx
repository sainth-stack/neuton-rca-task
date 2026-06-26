import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

import { colors, displayFont } from "@/lib/theme";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
};

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  primaryAction,
  secondaryAction,
}: PageHeaderProps) {
  const actions =
    primaryAction || secondaryAction ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {secondaryAction}
        {primaryAction}
      </Box>
    ) : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow ? (
          <Typography
            sx={{
              mb: 0.75,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: colors.primary,
            }}
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Typography
          component="h1"
          sx={{
            fontFamily: displayFont,
            fontWeight: 600,
            fontSize: "1.75rem",
            letterSpacing: "-0.015em",
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 640, fontSize: "0.9375rem" }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions}
    </Box>
  );
}
