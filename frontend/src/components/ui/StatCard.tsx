import type { ElementType } from "react";
import { Box, Paper, Typography } from "@mui/material";

import { colors, displayFont, surfaceSx } from "@/lib/theme";

type StatCardProps = {
  title: string;
  value: string | number;
  helperText?: string;
  icon?: ElementType<{ sx?: object }>;
};

export default function StatCard({ title, value, helperText, icon: Icon }: StatCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        ...surfaceSx,
        p: 2.5,
        height: "100%",
        transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgb(79 70 229 / 0.06)",
          borderColor: `${colors.primary}30`,
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: "0.8125rem" }}>
          {title}
        </Typography>
        {Icon ? (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: colors.primaryLight,
              color: colors.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </Box>
        ) : null}
      </Box>
      <Typography
        sx={{
          mt: 1,
          fontFamily: displayFont,
          fontWeight: 700,
          fontSize: "2rem",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {helperText}
        </Typography>
      ) : null}
    </Paper>
  );
}
