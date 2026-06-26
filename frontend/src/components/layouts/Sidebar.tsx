import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import type { NavSection } from "@/components/layouts/nav-config";
import { colors, displayFont, layoutTokens } from "@/lib/theme";

type SidebarProps = {
  sections: NavSection[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({ sections }: { sections: NavSection[] }) {
  const location = useLocation();

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: colors.paper }}>
      <Box
        sx={{
          height: layoutTokens.topbarHeight,
          px: 2,
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            bgcolor: colors.primary,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: displayFont,
            fontWeight: 800,
            fontSize: "0.875rem",
            mr: 1.25,
          }}
        >
          N7
        </Box>
        <Box>
          <Typography sx={{ fontFamily: displayFont, fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.2 }}>
            RCA Engine
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Log intelligence
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", py: 1.5, px: 1 }}>
        {sections.map((section) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Typography
              sx={{
                px: 1.25,
                mb: 0.75,
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: colors.textMuted,
              }}
            >
              {section.title}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const active = isActive(location.pathname, item.href);
                return (
                  <ListItemButton
                    key={item.href}
                    component={RouterLink}
                    to={item.href}
                    selected={active}
                    sx={{
                      mb: 0.25,
                      borderRadius: `${layoutTokens.navRadius}px`,
                      minHeight: layoutTokens.navItemHeight,
                      color: active ? colors.primary : colors.textSecondary,
                      bgcolor: active ? layoutTokens.navActiveBg : "transparent",
                      "&.Mui-selected": {
                        bgcolor: layoutTokens.navActiveBg,
                        color: colors.primary,
                        "&:hover": { bgcolor: layoutTokens.navActiveBg },
                      },
                      "&:hover": {
                        bgcolor: active ? layoutTokens.navActiveBg : layoutTokens.navHoverBg,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 32,
                        color: active ? colors.primary : colors.textSecondary,
                      }}
                    >
                      <item.icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: active ? 600 : 500 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function Sidebar({ sections, mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: layoutTokens.sidebarWidth, boxSizing: "border-box" },
        }}
      >
        <SidebarContent sections={sections} />
      </Drawer>

      <Box
        component="nav"
        sx={{
          display: { xs: "none", md: "block" },
          width: layoutTokens.sidebarWidth,
          flexShrink: 0,
          borderRight: `1px solid ${colors.border}`,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <SidebarContent sections={sections} />
      </Box>
    </>
  );
}
