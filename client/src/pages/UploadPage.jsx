import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  Bell,
  Trash2,
  Loader2,
  Zap,
  ArrowRight,
  Sparkles,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";

function StatPill({ icon: Icon, value, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105 hover:shadow-neon-sm cursor-pointer border ${color}`}
    >
      <Icon className="w-3 h-3" />
      <span>{value}</span>
      <span className="opacity-70 font-medium">{label}</span>
    </button>
  );
}

function PortalHeader() {
  return (
    <div className="relative mb-8">
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-brand-600/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="relative text-center">
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-neon-cyan shadow-neon-lg mb-5">
          <Zap className="w-8 h-8 text-white" />
          <div className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-glow-pulse" />
        </div>
        <h1 className="text-3xl font-bold text-gradient tracking-tight">
          SpeakX Notification Portal
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Upload your learning journey CSV to auto-generate targeted push
          notifications with AI-powered images across 6 user segments.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan" />
          </span>
          <span className="text-[11px] text-cyan-400 font-medium tracking-wide uppercase">
            System Online
          </span>
        </div>
      </div>
    </div>
  );
}

function UploadZone({ getRootProps, getInputProps, isDragActive, uploading }) {
  return (
    <div
      {...getRootProps()}
      className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group ${
        isDragActive
          ? "border-brand-500 bg-brand-600/10 scale-[1.01] shadow-neon-md"
          : uploading
            ? "border-zinc-700 bg-zinc-900/50 cursor-wait"
            : "border-brand-500/20 bg-zinc-900/30 hover:border-brand-500/40 hover:bg-brand-600/5 hover:shadow-neon-sm"
      }`}
    >
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-500/30 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-500/30 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-500/30 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-500/30 rounded-br-2xl" />
      <input {...getInputProps()} />
      <div className="relative z-10">
        {uploading ? (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl glass-card shadow-neon-sm">
              <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
            </div>
            <p className="text-sm text-zinc-300 font-medium">Processing CSV &amp; generating notifications...</p>
            <div className="w-48 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-neon-cyan rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        ) : isDragActive ? (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand-600/20 animate-bounce shadow-neon-md">
              <Upload className="w-7 h-7 text-brand-400" />
            </div>
            <p className="text-sm text-brand-400 font-semibold">Drop the file here</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl glass-card group-hover:shadow-neon-sm transition-all">
              <Upload className="w-7 h-7 text-zinc-500 group-hover:text-brand-400 transition-colors" />
            </div>
            <div>
              <p className="text-sm text-zinc-200 font-medium">Drag &amp; drop your CSV file here</p>
              <p className="text-xs text-zinc-500 mt-1">or click to browse &middot; .csv files only</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadResult({ result, navigate }) {
  if (!result) return null;
  if (!result.success) {
    return (
      <div className="mt-6 rounded-xl p-5 bg-red-600/10 border border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-300">Upload failed: {result.error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-xl overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-emerald-900/15 to-zinc-900/50">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-300">{result.batch_name}</p>
          <span className="text-[10px] text-emerald-600 ml-auto">Just uploaded</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button onClick={() => navigate(`/stories?batch_id=${result.batch_id}`)} className="glass-card rounded-lg p-3 text-center group cursor-pointer hover-lift">
            <BookOpen className="w-4 h-4 text-brand-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-zinc-100">{result.stories}</p>
            <p className="text-[10px] text-zinc-500 uppercase group-hover:text-brand-400 transition-colors">Stories <ArrowRight className="w-2.5 h-2.5 inline ml-0.5" /></p>
          </button>
          <button onClick={() => navigate(`/segments?batch_id=${result.batch_id}`)} className="glass-card rounded-lg p-3 text-center group cursor-pointer hover-lift">
            <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-zinc-100">{result.segments}</p>
            <p className="text-[10px] text-zinc-500 uppercase group-hover:text-emerald-400 transition-colors">Segments <ArrowRight className="w-2.5 h-2.5 inline ml-0.5" /></p>
          </button>
          <button onClick={() => navigate(`/notifications?batch_id=${result.batch_id}`)} className="glass-card rounded-lg p-3 text-center group cursor-pointer hover-lift">
            <Bell className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-zinc-100">{result.notifications}</p>
            <p className="text-[10px] text-zinc-500 uppercase group-hover:text-amber-400 transition-colors">Notifications <ArrowRight className="w-2.5 h-2.5 inline ml-0.5" /></p>
          </button>
        </div>
      </div>
    </div>
  );
}

function BatchCard({ batch, navigate, onDelete }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4 hover-lift group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200 truncate mb-2">{batch.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatPill icon={BookOpen} value={batch.story_count} label="stories" color="bg-brand-600/10 text-brand-400 border-brand-500/20 hover:bg-brand-600/20" onClick={() => navigate(`/stories?batch_id=${batch.id}`)} />
          {batch.segments_count > 0 && <StatPill icon={Users} value={batch.segments_count} label="segments" color="bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20" onClick={() => navigate(`/segments?batch_id=${batch.id}`)} />}
          {batch.notifications_count > 0 && <StatPill icon={Bell} value={batch.notifications_count} label="notifs" color="bg-amber-600/10 text-amber-400 border-amber-500/20 hover:bg-amber-600/20" onClick={() => navigate(`/notifications?batch_id=${batch.id}`)} />}
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">{batch.filename} &middot; {new Date(batch.created_at).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={() => navigate(`/stories?batch_id=${batch.id}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-400 bg-brand-600/10 border border-brand-500/15 hover:bg-brand-600/20 hover:shadow-neon-sm transition-all">View</button>
        <button onClick={() => onDelete(batch.id)} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-600/10 transition-colors" aria-label="Delete batch"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();

  async function loadBatches() {
    try { setBatches(await api.getBatches()); } catch { /* ignore */ }
  }
  useEffect(() => { loadBatches(); }, []);

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { toast.error("Please upload a .csv file"); return; }
    setUploading(true);
    setResult(null);
    try {
      const data = await api.uploadCSV(file);
      setResult({ success: true, ...data });
      toast.success(data.message);
      loadBatches();
    } catch (err) {
      setResult({ success: false, error: err.message });
      toast.error(err.message);
    } finally { setUploading(false); }
  }, []);

  async function handleDeleteBatch(id) {
    if (!confirm("Delete this batch and all its stories, segments, and notifications?")) return;
    try { await api.deleteBatch(id); toast.success("Batch deleted"); loadBatches(); }
    catch (err) { toast.error(err.message); }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "text/csv": [".csv"] }, maxFiles: 1, disabled: uploading });

  return (
    <>
      <PortalHeader />
      <div className="flex items-center gap-4 mb-6 px-1">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600" />
          <span className="font-medium text-zinc-400">Supported:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 glass-card px-2 py-0.5 rounded-md">SpeakX Journey CSV</span>
          <span className="text-[10px] text-zinc-500 glass-card px-2 py-0.5 rounded-md">Standard Story CSV</span>
        </div>
      </div>
      <UploadZone getRootProps={getRootProps} getInputProps={getInputProps} isDragActive={isDragActive} uploading={uploading} />
      <UploadResult result={result} navigate={navigate} />
      {!result && batches.length === 0 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-zinc-600">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"><Radio className="w-3 h-3" /> Upload</div>
          <ArrowRight className="w-3 h-3 text-brand-500/40" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"><Sparkles className="w-3 h-3" /> Auto-Generate</div>
          <ArrowRight className="w-3 h-3 text-brand-500/40" />
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest"><Bell className="w-3 h-3" /> Notifications</div>
        </div>
      )}
      {batches.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Previous Uploads</h3>
            <span className="text-[10px] text-zinc-600">{batches.length} batch{batches.length !== 1 ? "es" : ""}</span>
          </div>
          <div className="space-y-2">
            {batches.map((batch) => <BatchCard key={batch.id} batch={batch} navigate={navigate} onDelete={handleDeleteBatch} />)}
          </div>
        </div>
      )}
    </>
  );
}
