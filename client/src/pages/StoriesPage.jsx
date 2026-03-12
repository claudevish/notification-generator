import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Sparkles,
  Trash2,
  Eye,
  BookOpen,
  Loader2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";

export default function StoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get("batch_id") || "");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
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
      if (search) params.search = search;
      if (selectedBatch) params.batch_id = selectedBatch;
      const data = await api.getStories(params);
      setStories(data);
    } catch {
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    loadStories();
  }, [selectedBatch]);

  useEffect(() => {
    const timeout = setTimeout(loadStories, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  function handleBatchChange(batchId) {
    setSelectedBatch(batchId);
    if (batchId) {
      setSearchParams({ batch_id: batchId });
    } else {
      setSearchParams({});
    }
  }

  async function handleGenerate(id) {
    setGenerating(id);
    try {
      await api.generateForStory(id);
      toast.success("Segments & notifications generated!");
      loadStories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this story and all its segments/notifications?")) return;
    try {
      await api.deleteStory(id);
      toast.success("Story deleted");
      loadStories();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const DIFF_VARIANT = {
    Beginner: "green",
    Intermediate: "amber",
    Advanced: "red",
  };

  const currentBatch = batches.find((b) => String(b.id) === selectedBatch);

  return (
    <>
      <PageHeader
        title={currentBatch ? currentBatch.name : "Stories"}
        description={
          currentBatch
            ? `${currentBatch.story_count} stories from ${currentBatch.filename}`
            : "All uploaded stories from your CSV files."
        }
      />

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Batch selector */}
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={(e) => handleBatchChange(e.target.value)}
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

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-card rounded-lg pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus-neon"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={selectedBatch ? "No stories in this batch" : "No stories yet"}
          description="Upload a CSV file to get started with notification generation."
          action={
            <button
              onClick={() => navigate("/")}
              className="text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              Upload CSV &rarr;
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-500/10 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="text-left py-3 pr-4 font-medium">Story</th>
                <th className="text-left py-3 pr-4 font-medium">Theme</th>
                <th className="text-left py-3 pr-4 font-medium">Difficulty</th>
                <th className="text-left py-3 pr-4 font-medium">Lesson</th>
                {!selectedBatch && (
                  <th className="text-left py-3 pr-4 font-medium">Batch</th>
                )}
                <th className="text-left py-3 pr-4 font-medium">Segments</th>
                <th className="text-right py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((story) => (
                <tr
                  key={story.id}
                  className="border-b border-brand-500/5 hover:bg-brand-600/5 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <p className="text-zinc-100 font-medium">{story.title}</p>
                    {story.story_id && (
                      <p className="text-xs text-zinc-500 mt-0.5">{story.story_id}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="purple">{story.theme || "N/A"}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={DIFF_VARIANT[story.difficulty] || "default"}>
                      {story.difficulty || "N/A"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-zinc-400">
                    {story.lesson_number || "-"}
                  </td>
                  {!selectedBatch && (
                    <td className="py-3 pr-4">
                      {story.batch_name ? (
                        <button
                          onClick={() => handleBatchChange(String(story.batch_id))}
                          className="text-xs text-zinc-400 hover:text-brand-400 transition-colors truncate max-w-[120px] block"
                          title={story.batch_name}
                        >
                          {story.batch_name}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-600">-</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 pr-4">
                    {story.segments_count > 0 ? (
                      <button
                        onClick={() => navigate(`/segments?story_id=${story.id}`)}
                        className="group"
                        aria-label={`View ${story.segments_count} segments`}
                      >
                        <Badge variant="green" className="cursor-pointer group-hover:ring-1 group-hover:ring-emerald-500/40 transition-all">
                          {story.segments_count} segments
                        </Badge>
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600">Not generated</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleGenerate(story.id)}
                        disabled={generating === story.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-brand-400 bg-brand-600/10 hover:bg-brand-600/20 border border-brand-500/15 hover:shadow-neon-sm transition-colors disabled:opacity-50"
                        aria-label="Generate notifications"
                      >
                        {generating === story.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Generate
                      </button>
                      {story.segments_count > 0 && (
                        <button
                          onClick={() => navigate(`/notifications?story_id=${story.id}`)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
                          aria-label="View generated content"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                        aria-label="Delete story"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
