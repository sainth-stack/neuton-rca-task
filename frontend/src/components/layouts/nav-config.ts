import type { ElementType } from "react";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";

export type NavItem = {
  label: string;
  href: string;
  icon: ElementType<{ sx?: object }>;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Platform",
    items: [
      { label: "Dashboard", href: "/", icon: DashboardOutlinedIcon },
      { label: "Data Ingest", href: "/ingest", icon: CloudUploadOutlinedIcon },
      { label: "RCA Query", href: "/investigate", icon: PsychologyOutlinedIcon },
      { label: "Log Explorer", href: "/logs", icon: ManageSearchOutlinedIcon },
    ],
  },
];
