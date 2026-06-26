import { createTheme } from "@mui/material/styles";

import { brandTokens, fontTokens, radiusTokens } from "@/lib/tokens";

export const RADIUS = radiusTokens.lg;
export const displayFont = fontTokens.display;

export const colors = {
  primary: brandTokens.primary,
  primaryLight: brandTokens.primaryLight,
  primaryDark: brandTokens.primaryHover,
  accent: brandTokens.accent,
  accentLight: brandTokens.accentLight,
  accentHover: brandTokens.accentHover,
  background: brandTokens.surfaceMuted,
  surfaceTint: brandTokens.surfaceTint,
  paper: brandTokens.surfaceWhite,
  border: brandTokens.borderDefault,
  borderHover: brandTokens.borderHover,
  textPrimary: brandTokens.textPrimary,
  textSecondary: brandTokens.textSecondary,
  textMuted: brandTokens.textMuted,
  ink: brandTokens.ink,
  success: brandTokens.accent,
  successLight: brandTokens.accentLight,
  warning: "#D97706",
  warningLight: "#FEF3C7",
  error: "#DC2626",
  errorLight: "#FEE2E2",
  muted: brandTokens.borderMuted,
  tableHeader: brandTokens.surfaceMuted,
  navActive: brandTokens.primaryLight,
  navHover: brandTokens.surfaceMuted,
  chipDraftBg: "#F1F5F9",
  chipDraftText: brandTokens.textMuted,
  chipSuccessBg: brandTokens.accentLight,
  chipSuccessText: "#047857",
  chipWarningBg: "#FEF3C7",
  chipWarningText: "#B45309",
  chipInfoBg: brandTokens.primaryLight,
  chipInfoText: brandTokens.primaryHover,
  chipErrorBg: "#FEE2E2",
  chipErrorText: "#B91C1C",
} as const;

export const statusChipColors = {
  draft: { bg: colors.chipDraftBg, color: colors.chipDraftText },
  running: { bg: colors.chipSuccessBg, color: colors.chipSuccessText, dot: colors.success },
  paused: { bg: colors.chipWarningBg, color: colors.chipWarningText, dot: colors.warning },
  completed: { bg: colors.chipSuccessBg, color: colors.chipSuccessText, dot: colors.success },
  active: { bg: colors.chipSuccessBg, color: colors.chipSuccessText, dot: colors.success },
  inactive: { bg: colors.chipDraftBg, color: colors.chipDraftText },
  qualified: { bg: colors.chipInfoBg, color: colors.chipInfoText, dot: colors.primary },
  failed: { bg: colors.chipErrorBg, color: colors.chipErrorText, dot: colors.error },
  warning: { bg: colors.chipWarningBg, color: colors.chipWarningText, dot: colors.warning },
  success: { bg: colors.chipSuccessBg, color: colors.chipSuccessText, dot: colors.success },
} as const;

export type StatusChipVariant = keyof typeof statusChipColors;

export const chartColors = {
  primary: colors.primary,
  secondary: colors.accent,
  grid: colors.border,
} as const;

export const chartAxisTick = {
  fontSize: 12,
  fill: colors.textSecondary,
} as const;

export const chartTooltipStyle = {
  borderRadius: radiusTokens.md,
  border: `1px solid ${colors.border}`,
  fontSize: 12,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
} as const;

export const TABLE_RADIUS = 10;

export const tableCellPadding = {
  head: { py: 1.5, px: 2 },
  body: { py: 1.75, px: 2 },
} as const;

export const tableSurfaceSx = {
  borderRadius: `${TABLE_RADIUS}px`,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.sm,
  bgcolor: colors.paper,
  overflow: "hidden",
} as const;

export const layoutTokens = {
  sidebarWidth: 260,
  sidebarCollapsedWidth: 64,
  topbarHeight: 64,
  contentPadding: { xs: 2, md: 3 },
  contentMaxWidth: 1280,
  navRadius: radiusTokens.md,
  navItemHeight: 36,
  navActiveBg: brandTokens.primaryLight,
  navHoverBg: brandTokens.surfaceMuted,
} as const;

export const surfaceSx = {
  borderRadius: `${RADIUS}px`,
  border: `1px solid ${colors.border}`,
  boxShadow: shadows.sm,
  bgcolor: colors.paper,
} as const;

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: "#FFFFFF",
    },
    success: { main: colors.success, light: colors.successLight, dark: colors.accentHover },
    warning: { main: colors.warning, light: colors.warningLight },
    error: { main: colors.error, light: colors.errorLight },
    background: { default: colors.background, paper: colors.paper },
    text: { primary: colors.textPrimary, secondary: colors.textSecondary },
    divider: colors.border,
  },
  typography: {
    fontFamily: fontTokens.sans,
    h4: {
      fontFamily: fontTokens.display,
      fontWeight: 600,
      fontSize: "1.5rem",
      letterSpacing: "-0.015em",
    },
    body2: { fontSize: "0.875rem", lineHeight: 1.5 },
    caption: { fontSize: "0.75rem", lineHeight: 1.4 },
  },
  shape: { borderRadius: RADIUS },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.background, color: colors.textPrimary },
        "::selection": { backgroundColor: colors.primary, color: "#fff" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: radiusTokens.md,
          boxShadow: "none",
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none", backgroundColor: colors.primaryDark },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none", backgroundColor: colors.paper },
        outlined: { borderColor: colors.border },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.md,
          backgroundColor: colors.paper,
          fontSize: "0.875rem",
          "& fieldset": { borderColor: colors.border },
          "&:hover fieldset": { borderColor: colors.borderHover },
          "&.Mui-focused fieldset": {
            borderColor: colors.primary,
            borderWidth: 1,
            boxShadow: "0 0 0 2px rgb(79 70 229 / 0.15)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.75rem",
          color: colors.textSecondary,
          bgcolor: colors.tableHeader,
        },
        body: { fontSize: "0.8125rem" },
      },
    },
  },
});
