import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, Breadcrumbs, IconButton, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { navSections } from "@/components/layouts/nav-config";
import StatusChip from "@/components/ui/StatusChip";
import { colors, layoutTokens } from "@/lib/theme";

type TopbarProps = {
  onMenuClick?: () => void;
};

function routeMeta(pathname: string): { label: string; parent?: string } {
  for (const section of navSections) {
    for (const item of section.items) {
      if (item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href))) {
        return { label: item.label, parent: section.title };
      }
    }
  }
  return { label: "Dashboard" };
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const meta = routeMeta(location.pathname);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${colors.border}`,
        color: colors.textPrimary,
      }}
    >
      <Toolbar sx={{ minHeight: `${layoutTokens.topbarHeight}px !important`, px: { xs: 2, md: 3 } }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: "none" }, color: colors.textSecondary }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Breadcrumbs sx={{ fontSize: "0.8125rem", color: colors.textMuted }}>
            <Typography component={RouterLink} to="/" color="inherit" sx={{ textDecoration: "none" }}>
              RCA Engine
            </Typography>
            {meta.parent ? <Typography color="text.secondary">{meta.parent}</Typography> : null}
            <Typography color="text.primary" fontWeight={600}>
              {meta.label}
            </Typography>
          </Breadcrumbs>
        </Box>

      </Toolbar>
    </AppBar>
  );
}
