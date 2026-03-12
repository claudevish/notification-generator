import { useState, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  Image,
  Database,
  Loader2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import { api } from "../lib/api";

export default function ExportPage() {
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.getHealth().then(setStats).catch(() => {});
    api.getBatches().then(setBatches).catch(() => {});
  }, []);

  const batchQuery = selectedBatch ? `?batch_id=${selectedBatch}` : "";

  const EXPORTS = [
    {
      key: "stories",
      icon: FileSpreadsheet,
      title: "Stories",
      description: "Export all uploaded stories with metadata",
      endpoint: `/api/export/stories${batchQuery}`,
      filename: "stories.csv",
    },
    {
      key: "notifications",
      icon: Database,
      title: "Notifications",
      description: "Export all notifications with story, segment, language, title, body, CTA, and image prompts",
      endpoint: `/api/export/notifications${batchQuery}`,
      filename: "notifications.csv",
    },
    {
      key: "image-prompts",
      icon: Image,
      title: "Image Prompts",
      description: "Export all AI image generation prompts for notification banners",
      endpoint: `/api/export/image-prompts${batchQuery}`,
      filename: "image_prompts.csv",
    },
    {
      key: "all",
      icon: Download,
      title: "Everything",
      description: "Full export: stories + segments + notifications + image prompts in one CSV",
      endpoint: `/api/export/all${batchQuery}`,
      filename: "all_data.csv",
    },
  ];

  async function handleDownload(exp) {
    setDownloading(exp.key);
    try {
      const res = await fetch(exp.endpoint);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exp.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${exp.filename}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Export Data"
        description="Download your stories, segments, notifications, and image prompts as CSV files."
      />

      {/* Batch filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="appearance-none glass-card rounded-lg pl-3 pr-8 py-2.5 text-sm text-zinc-200 focus-neon cursor-pointer"
          >
            <option value="">All Uploads</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.story_count})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>
        {selectedBatch && (
          <span className="text-xs text-zinc-500">
            Exporting data for selected batch only
          </span>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Batches", count: stats.counts.batches, color: "text-blue-400" },
            { label: "Stories", count: stats.counts.stories, color: "text-brand-400" },
            { label: "Segments", count: stats.counts.segments, color: "text-emerald-400" },
            { label: "Notifications", count: stats.counts.notifications, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                {s.label}
              </p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Export cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {EXPORTS.map((exp) => (
          <div
            key={exp.key}
            className="glass-card rounded-xl p-5 hover-lift flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center flex-shrink-0">
              <exp.icon className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-zinc-200">{exp.title}</h3>
              <p className="text-xs text-zinc-500 mt-1">{exp.description}</p>
              <button
                onClick={() => handleDownload(exp)}
                disabled={downloading === exp.key}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 disabled:opacity-50"
              >
                {downloading === exp.key ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
