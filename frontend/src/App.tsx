import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "@/components/layouts/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import IngestPage from "@/pages/IngestPage";
import InvestigatePage from "@/pages/InvestigatePage";
import LogsPage from "@/pages/LogsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="ingest" element={<IngestPage />} />
        <Route path="investigate" element={<InvestigatePage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
