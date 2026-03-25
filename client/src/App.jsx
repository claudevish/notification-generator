import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import StoriesPage from "./pages/StoriesPage";
import SegmentsPage from "./pages/SegmentsPage";
import ThemesPage from "./pages/ThemesPage";
import NotificationCenterPage from "./pages/NotificationCenterPage";
import CampaignsPage from "./pages/CampaignsPage";
import ExportPage from "./pages/ExportPage";
import SettingsPage from "./pages/SettingsPage";
import AutomationDashboard from "./pages/AutomationDashboard";
import UserAnalyticsPage from "./pages/UserAnalyticsPage";

function ToasterWrapper() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: theme === "dark" ? {
          background: "rgba(24, 24, 27, 0.8)",
          backdropFilter: "blur(16px)",
          color: "#fafafa",
          border: "1px solid rgba(139, 92, 246, 0.15)",
          fontSize: "13px",
          boxShadow: "0 0 20px rgba(139, 92, 246, 0.08)",
        } : {
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(16px)",
          color: "#18181b",
          border: "1px solid rgba(139, 92, 246, 0.12)",
          fontSize: "13px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToasterWrapper />
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/segments" element={<SegmentsPage />} />
            <Route path="/themes" element={<ThemesPage />} />
            <Route path="/notifications" element={<NotificationCenterPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/automation" element={<AutomationDashboard />} />
            <Route path="/user-analytics" element={<UserAnalyticsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
