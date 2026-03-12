import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import UploadPage from "./pages/UploadPage";
import StoriesPage from "./pages/StoriesPage";
import SegmentsPage from "./pages/SegmentsPage";
import ThemesPage from "./pages/ThemesPage";
import NotificationCenterPage from "./pages/NotificationCenterPage";
import ExportPage from "./pages/ExportPage";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(24, 24, 27, 0.8)",
            backdropFilter: "blur(16px)",
            color: "#fafafa",
            border: "1px solid rgba(139, 92, 246, 0.15)",
            fontSize: "13px",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.08)",
          },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/segments" element={<SegmentsPage />} />
          <Route path="/themes" element={<ThemesPage />} />
          <Route path="/notifications" element={<NotificationCenterPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
