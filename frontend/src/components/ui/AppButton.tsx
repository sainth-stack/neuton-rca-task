import type { ReactNode } from "react";
import { forwardRef } from "react";
import type { ButtonProps } from "@mui/material";
import { Button, CircularProgress } from "@mui/material";

import { colors } from "@/lib/theme";

export type AppButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type AppButtonProps = Omit<ButtonProps, "variant" | "color"> & {
  variant?: AppButtonVariant;
  loading?: boolean;
  leftIcon?: ReactNode;
};

const variantMap: Record<AppButtonVariant, { muiVariant: ButtonProps["variant"]; color: ButtonProps["color"] }> = {
  primary: { muiVariant: "contained", color: "primary" },
  secondary: { muiVariant: "outlined", color: "inherit" },
  danger: { muiVariant: "contained", color: "error" },
  ghost: { muiVariant: "text", color: "inherit" },
};

const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(function AppButton(
  { variant = "primary", loading = false, disabled, leftIcon, children, sx, ...props },
  ref,
) {
  const mapped = variantMap[variant];

  return (
    <Button
      ref={ref}
      variant={mapped.muiVariant}
      color={mapped.color}
      disabled={disabled || loading}
      startIcon={loading ? undefined : leftIcon}
      sx={{
        ...(variant === "secondary" && {
          borderColor: `${colors.primary}40`,
          color: colors.primary,
          bgcolor: colors.paper,
          "&:hover": { borderColor: colors.primary, bgcolor: colors.primaryLight },
        }),
        ...(variant === "ghost" && {
          color: colors.textSecondary,
          "&:hover": { bgcolor: colors.background, color: colors.textPrimary },
        }),
        ...sx,
      }}
      {...props}
    >
      {loading ? (
        <>
          <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
});

export default AppButton;
