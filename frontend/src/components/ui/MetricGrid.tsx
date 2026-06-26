import type { ReactNode } from "react";
import { Box } from "@mui/material";

type MetricGridProps = {
  children: ReactNode;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
};

export default function MetricGrid({ children, columns = { xs: 1, sm: 2, lg: 4 } }: MetricGridProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: `repeat(${columns.xs ?? 1}, minmax(0, 1fr))`,
          sm: `repeat(${columns.sm ?? 2}, minmax(0, 1fr))`,
          md: columns.md ? `repeat(${columns.md}, minmax(0, 1fr))` : undefined,
          lg: `repeat(${columns.lg ?? 4}, minmax(0, 1fr))`,
        },
      }}
    >
      {children}
    </Box>
  );
}
