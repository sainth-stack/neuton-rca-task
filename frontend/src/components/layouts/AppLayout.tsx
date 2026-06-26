import { useState } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

import { navSections } from "@/components/layouts/nav-config";
import Sidebar from "@/components/layouts/Sidebar";
import Topbar from "@/components/layouts/Topbar";
import { layoutTokens } from "@/lib/theme";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: { md: "flex" } }}>
      <Sidebar sections={navSections} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <Box
          component="main"
          sx={{
            flex: 1,
            px: layoutTokens.contentPadding,
            py: { xs: 2, md: 3 },
            maxWidth: layoutTokens.contentMaxWidth,
            width: "100%",
            mx: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
