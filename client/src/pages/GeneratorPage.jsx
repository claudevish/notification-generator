import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  BookOpen,
  Zap,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";

export default function GeneratorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get("batch_id") || "");
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  async function loadBatches() {
    try {
      setBatches(await api.getBatches());
    } catch {
      /* ignore */
    }
  }

  async function loadStories() {
    setLoading(true);
    try {
      const params = {};
      if (selectedBatch) params.batch_id = selectedBatch;
      setStories(await api.getStories(params));
    } catch {
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBatches(); }, []);
  useEffect(() => { loadStories(); setSelected(new Set()); }, [selectedBatch]);

  function handleBatchChange(batchId) {
    setSelectedBatch(batchId);
    if (batchId) {
      setSearchParams({ batch_id: batchId });
    } else {
      setSearchParams({});
    }
  }

  function toggleAll() {
    if (selected.size === stories.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(stories.map((s) => s.id)));
    }
  }

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function generateSelected() {
    if (selected.size === 0) {
      toast.error("Select at least one story");
      return;
    }

    setGenerating(true);
    setResults([]);
    const res = [];

    for (const id of selected) {
      const story = stories.find((s) => s.id === id);
      try {
        const data = await api.generateForStory(id);
        res.push({ id, title: story?.title, success: true, segments: data.segments });
      } catch (err) {
        res.push({ id, title: story?.title, success: false, error: err.message });
      }
      setResults([...res]);
    }

    setGenerating(false);
    toast.success(`Generated for ${res.filter((r) => r.success).length} stories!`);
    loadStories();
  }

  const pendingStories = stories.filter((s) => s.segments_count === 0);

  return (
    <>
      <PageHeader
        title="Generator"
        description="Select stories and generate user segments, notifications in 3 languages, and image prompts."
        action={
          <button
            onClick={generateSelected}
            disabled={generating || selected.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate ({selected.size})
          </button>
        }
      />

      {/* Batch filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-3 pr-8 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No stories uploaded"
          description="Upload a CSV first to start generating notifications."
          action={
            <button onClick={() => navigate("/")} className="text-sm font-medium text-brand-400">
              Upload CSV &rarr;
            </button>
          }
        />
      ) : (
        <>
          {/* Quick action for pending stories */}
          {pendingStories.length > 0 && (
            <div className="bg-brand-600/5 border border-brand-600/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-brand-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pendingStories.length} stories without segments
                  </p>
                  <p className="text-xs text-zinc-500">
                    Select and generate to create notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(new Set(pendingStories.map((s) => s.id)))}
                className="text-xs font-medium text-brand-400 hover:text-brand-300"
              >
                Select all pending
              </button>
            </div>
          )}

          {/* Select all */}
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.size === stories.length && stories.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Select all ({stories.length})</span>
            </label>
          </div>

          {/* Story list */}
          <div className="space-y-2">
            {stories.map((story) => (
              <div
                key={story.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                  selected.has(story.id)
                    ? "bg-brand-600/5 border-brand-600/30"
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
                onClick={() => toggle(story.id)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(story.id)}
                  onChange={() => toggle(story.id)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {story.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {story.theme || "No theme"} &middot;{" "}
                    {story.difficulty || "Unknown difficulty"}
                    {story.batch_name && (
                      <> &middot; {story.batch_name}</>
                    )}
                  </p>
                </div>
                {story.segments_count > 0 ? (
                  <Badge variant="green">{story.segments_count} segments</Badge>
                ) : (
                  <Badge variant="default">Pending</Badge>
                )}
              </div>
            ))}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-8 space-y-2">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Results</h3>
              {results.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    r.success
                      ? "bg-emerald-600/5 border border-emerald-600/20"
                      : "bg-red-600/5 border border-red-600/20"
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 flex-shrink-0 ${
                      r.success ? "text-emerald-400" : "text-red-400"
                    }`}
                  />
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {r.title} &mdash;{" "}
                    {r.success
                      ? `${r.segments} segments created`
                      : `Error: ${r.error}`}
                  </p>
                </div>
              ))}
              <button
                onClick={() => navigate("/preview")}
                className="mt-3 text-sm font-medium text-brand-400 hover:text-brand-300"
              >
                Preview notifications &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
