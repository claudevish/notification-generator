import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users,
  Pencil,
  Check,
  X,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  PlayCircle,
  Moon,
  TrendingDown,
  Clock,
  AlertTriangle,
  Bell,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";

const SEGMENT_META = {
  "New users who haven't started lessons": {
    short: "New Users",
    color: "#8b5cf6",
    icon: UserPlus,
    description: "Users who signed up but haven't started any lessons yet",
  },
  "Users who started but didn't finish": {
    short: "In Progress",
    color: "#f59e0b",
    icon: PlayCircle,
    description: "Users with incomplete lesson progress",
  },
  "Dormant users (no activity 7+ days)": {
    short: "Dormant",
    color: "#ef4444",
    icon: Moon,
    description: "Users with no activity for 7 or more days",
  },
  "Users with less than 50% practice": {
    short: "Low Practice",
    color: "#3b82f6",
    icon: TrendingDown,
    description: "Users whose practice completion is below 50%",
  },
  "Users inactive for 3 days": {
    short: "3-Day Inactive",
    color: "#06b6d4",
    icon: Clock,
    description: "Users who haven't been active for 3 days",
  },
  "Users inactive for 7 days": {
    short: "7-Day Inactive",
    color: "#f97316",
    icon: AlertTriangle,
    description: "Users with no activity for exactly 7 days",
  },
};

function getMeta(segName) {
  return (
    SEGMENT_META[segName] || {
      short: segName,
      color: "#71717a",
      icon: Users,
      description: "",
    }
  );
}

/* ─── Overview: Stats + Clickable Distribution + Clickable Reference Cards ─── */

function SegmentOverview({ segments, stories, onSegmentTypeClick }) {
  const totalSegments = segments.length;
  const totalStories = stories.filter((s) => s.segments_count > 0).length;
  const totalNotifs = segments.reduce(
    (sum, s) => sum + (s.notification_count || 0),
    0
  );

  const typeCounts = {};
  const typeNotifCounts = {};
  for (const seg of segments) {
    const name = seg.segment_name;
    typeCounts[name] = (typeCounts[name] || 0) + 1;
    typeNotifCounts[name] =
      (typeNotifCounts[name] || 0) + (seg.notification_count || 0);
  }

  const maxCount = Math.max(...Object.values(typeCounts), 1);

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Segments",
            value: totalSegments,
            color: "text-brand-400",
          },
          {
            label: "Stories Covered",
            value: totalStories,
            color: "text-emerald-400",
          },
          {
            label: "Notifications",
            value: totalNotifs,
            color: "text-amber-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-xl p-5"
          >
            <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Segment type distribution — CLICKABLE */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Segment Distribution
        </h3>
        <div className="glass-card rounded-xl divide-y divide-brand-500/10 overflow-hidden">
          {Object.entries(typeCounts).map(([name, count]) => {
            const meta = getMeta(name);
            const Icon = meta.icon;
            const pct = (count / maxCount) * 100;
            const notifCount = typeNotifCounts[name] || 0;
            return (
              <button
                key={name}
                onClick={() => onSegmentTypeClick(name)}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer text-left group"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: meta.color + "20" }}
                >
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">
                    {meta.short}
                  </p>
                  <div className="mt-1.5 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-semibold text-zinc-300 tabular-nums">
                      {count}
                    </span>
                    <span className="text-[10px] text-zinc-600 ml-1.5">
                      {notifCount} notifs
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Segment type cards — CLICKABLE */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Segment Types
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(SEGMENT_META).map(([name, meta]) => {
            const Icon = meta.icon;
            const count = typeCounts[name] || 0;
            const notifCount = typeNotifCounts[name] || 0;
            return (
              <button
                key={name}
                onClick={() => count > 0 && onSegmentTypeClick(name)}
                disabled={count === 0}
                className={`glass-card rounded-xl p-4 space-y-2 text-left transition-all group ${
                  count > 0
                    ? "hover:border-brand-500/20 hover:bg-white/[0.03] cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: meta.color + "20" }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: meta.color }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {meta.short}
                    </p>
                  </div>
                  {count > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {meta.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600">
                    {count} {count === 1 ? "story" : "stories"}
                  </span>
                  {notifCount > 0 && (
                    <span className="text-xs text-zinc-600">
                      &middot; {notifCount} notifications
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Segment Type Detail (clicked from overview) ─── */

function SegmentTypeDetail({ segmentName, batchId, onBack }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const meta = getMeta(segmentName);
  const Icon = meta.icon;

  useEffect(() => {
    setLoading(true);
    const params = { segment_name: segmentName };
    if (batchId) params.batch_id = batchId;
    api
      .getNotifications(params)
      .then(setNotifications)
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, [segmentName, batchId]);

  // Group notifications by story
  const byStory = {};
  for (const n of notifications) {
    const key = n.story_id;
    if (!byStory[key])
      byStory[key] = {
        title: n.story_title,
        segmentId: n.segment_id,
        items: [],
      };
    byStory[key].items.push(n);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: meta.color + "20" }}
        >
          <Icon className="w-5 h-5" style={{ color: meta.color }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-100">{meta.short}</h2>
          <p className="text-xs text-zinc-500">{meta.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="purple">
            {notifications.length} notifications
          </Badge>
          <Badge variant="default">
            {Object.keys(byStory).length} stories
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description={`No notifications exist for "${meta.short}" segments.`}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(byStory).map(([storyId, group]) => (
            <div key={storyId}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-300">
                  {group.title}
                </h3>
                <button
                  onClick={() =>
                    navigate(
                      `/notifications?segment_id=${group.segmentId}`
                    )
                  }
                  className="flex items-center gap-1 text-[10px] font-medium text-brand-400 hover:text-brand-300"
                >
                  View in Notification Center
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((n) => (
                  <NotifPreviewCard key={n.id} notification={n} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Notification Preview Card (reusable) ─── */

function NotifPreviewCard({ notification: n }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden hover:border-brand-500/15 transition-colors">
      {n.image_url && (
        <img src={n.image_url} alt={n.title} className="w-full h-auto" />
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-zinc-100 leading-snug truncate">
            {n.title}
          </p>
          <Badge
            variant={
              n.language === "English"
                ? "blue"
                : n.language === "Hindi"
                  ? "amber"
                  : "purple"
            }
          >
            {n.language}
          </Badge>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
          {n.body}
        </p>
        {n.cta && (
          <p className="text-[10px] font-semibold text-brand-400 mt-1">
            {n.cta}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Story Mode: Clickable Segment Cards ─── */

function StorySegments({
  segments,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  editing,
  form,
  setForm,
  onSave,
  setEditing,
  navigate,
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {segments.map((seg) => {
        const meta = getMeta(seg.segment_name);
        const Icon = meta.icon;
        const isSelected = selectedId === seg.id;
        return (
          <div key={seg.id}>
            {editing === seg.id ? (
              <div className="glass-card rounded-xl p-4 space-y-3">
                <input
                  value={form.segment_name}
                  onChange={(e) =>
                    setForm({ ...form, segment_name: e.target.value })
                  }
                  className="w-full bg-zinc-800/60 border border-brand-500/10 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 focus-neon"
                />
                <textarea
                  value={form.logic_description}
                  onChange={(e) =>
                    setForm({ ...form, logic_description: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-zinc-800/60 border border-brand-500/10 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 focus-neon resize-none"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onSave(seg.id)}
                    className="p-1.5 rounded-md bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="p-1.5 rounded-md bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => onSelect(isSelected ? null : seg.id)}
                className={`w-full bg-zinc-900 border rounded-xl p-4 space-y-3 text-left transition-all cursor-pointer group ${
                  isSelected
                    ? "border-brand-500 ring-1 ring-brand-500/30"
                    : "border-zinc-800 hover:border-brand-500/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: meta.color + "20" }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: meta.color }}
                      />
                    </div>
                    <p className="text-sm font-medium text-zinc-200 leading-tight">
                      {meta.short}
                    </p>
                  </div>
                  <div
                    className="flex gap-1 ml-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEdit(seg)}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
                      aria-label="Edit segment"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/notifications?segment_id=${seg.id}`)
                      }
                      className="p-1 rounded text-zinc-500 hover:text-brand-400 hover:bg-brand-600/10"
                      aria-label="Open in Notification Center"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDelete(seg.id)}
                      className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-600/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                  {seg.logic_description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="blue">
                    {seg.notification_count} notifications
                  </Badge>
                  <span className="text-[10px] text-zinc-600 group-hover:text-brand-400 transition-colors flex items-center gap-1">
                    {isSelected ? "Click to collapse" : "Click to preview"}
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${isSelected ? "rotate-90" : ""}`}
                    />
                  </span>
                </div>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Inline Notification Preview (story mode segment click) ─── */

function SegmentNotifPreview({ segmentId, segmentName }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const meta = getMeta(segmentName);

  useEffect(() => {
    setLoading(true);
    api
      .getNotifications({ segment_id: segmentId })
      .then(setNotifications)
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, [segmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-zinc-500">
        No notifications found for this segment.
      </div>
    );
  }

  return (
    <div className="mt-4 glass-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Notification Preview &mdash; {meta.short}
        </h4>
        <button
          onClick={() => navigate(`/notifications?segment_id=${segmentId}`)}
          className="flex items-center gap-1 text-[10px] font-medium text-brand-400 hover:text-brand-300"
        >
          Open in Notification Center
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {notifications.map((n) => (
          <NotifPreviewCard key={n.id} notification={n} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page Component ─── */

export default function SegmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [segments, setSegments] = useState([]);
  const [stories, setStories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(
    searchParams.get("batch_id") || ""
  );
  const [selectedStory, setSelectedStory] = useState(
    searchParams.get("story_id") || ""
  );
  const [selectedSegmentType, setSelectedSegmentType] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    segment_name: "",
    logic_description: "",
  });
  const navigate = useNavigate();

  // Load batches
  useEffect(() => {
    api.getBatches().then(setBatches).catch(() => {});
  }, []);

  // Load stories when batch changes
  useEffect(() => {
    const params = {};
    if (selectedBatch) params.batch_id = selectedBatch;
    api.getStories(params).then(setStories).catch(() => {});
  }, [selectedBatch]);

  // Load segments
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selectedStory) params.story_id = selectedStory;
    else if (selectedBatch) params.batch_id = selectedBatch;
    api
      .getSegments(params)
      .then(setSegments)
      .catch(() => toast.error("Failed to load segments"))
      .finally(() => setLoading(false));
  }, [selectedStory, selectedBatch]);

  function handleBatchChange(batchId) {
    setSelectedBatch(batchId);
    setSelectedStory("");
    setSelectedSegmentType(null);
    setSelectedSegment(null);
    const params = {};
    if (batchId) params.batch_id = batchId;
    setSearchParams(params);
  }

  function handleStoryChange(storyId) {
    setSelectedStory(storyId);
    setSelectedSegmentType(null);
    setSelectedSegment(null);
    const params = {};
    if (selectedBatch) params.batch_id = selectedBatch;
    if (storyId) params.story_id = storyId;
    setSearchParams(params);
  }

  function startEdit(seg) {
    setEditing(seg.id);
    setForm({
      segment_name: seg.segment_name,
      logic_description: seg.logic_description || "",
    });
  }

  async function save(id) {
    try {
      await api.updateSegment(id, form);
      toast.success("Segment updated");
      setEditing(null);
      // Reload
      const params = {};
      if (selectedStory) params.story_id = selectedStory;
      else if (selectedBatch) params.batch_id = selectedBatch;
      setSegments(await api.getSegments(params));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this segment and all its notifications?")) return;
    try {
      await api.deleteSegment(id);
      toast.success("Segment deleted");
      setSelectedSegment(null);
      const params = {};
      if (selectedStory) params.story_id = selectedStory;
      else if (selectedBatch) params.batch_id = selectedBatch;
      setSegments(await api.getSegments(params));
    } catch (err) {
      toast.error(err.message);
    }
  }

  const currentStory = stories.find(
    (s) => String(s.id) === selectedStory
  );
  const selectedSegData = segments.find((s) => s.id === selectedSegment);

  return (
    <>
      <PageHeader
        title="Segments"
        description={
          selectedSegmentType
            ? `Viewing "${getMeta(selectedSegmentType).short}" segment notifications`
            : currentStory
              ? `Segments for "${currentStory.title}"`
              : "Overview of user segments across all stories."
        }
      />

      {/* Filters bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Batch filter */}
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="appearance-none glass-card rounded-lg pl-3 pr-8 py-2.5 text-sm text-zinc-200 focus-neon cursor-pointer"
          >
            <option value="">All Uploads</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>

        {/* Story filter */}
        <div className="relative">
          <select
            value={selectedStory}
            onChange={(e) => handleStoryChange(e.target.value)}
            className="appearance-none glass-card rounded-lg pl-3 pr-8 py-2.5 text-sm text-zinc-200 focus-neon cursor-pointer"
          >
            <option value="">
              {selectedBatch ? "All Stories in Batch" : "All Stories — Overview"}
            </option>
            {stories
              .filter((s) => s.segments_count > 0)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>

        {/* Back button */}
        {(selectedStory || selectedSegmentType) && (
          <button
            onClick={() => {
              if (selectedSegmentType) {
                setSelectedSegmentType(null);
              } else {
                handleStoryChange("");
              }
            }}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            <ChevronLeft className="w-3 h-3" />
            Back to overview
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : segments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No segments yet"
          description="Generate segments from the Stories page first."
          action={
            <button
              onClick={() => navigate("/stories")}
              className="text-sm font-medium text-brand-400 hover:text-brand-300"
            >
              Go to Stories &rarr;
            </button>
          }
        />
      ) : selectedSegmentType ? (
        <SegmentTypeDetail
          segmentName={selectedSegmentType}
          batchId={selectedBatch || null}
          onBack={() => setSelectedSegmentType(null)}
        />
      ) : selectedStory ? (
        <div>
          {currentStory && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default">
                {currentStory.difficulty || "N/A"}
              </Badge>
              <span className="text-xs text-zinc-500">
                {segments.length} segments &middot;{" "}
                {segments.reduce(
                  (s, seg) => s + (seg.notification_count || 0),
                  0
                )}{" "}
                notifications
              </span>
            </div>
          )}
          <StorySegments
            segments={segments}
            selectedId={selectedSegment}
            onSelect={setSelectedSegment}
            onEdit={startEdit}
            onDelete={handleDelete}
            editing={editing}
            form={form}
            setForm={setForm}
            onSave={save}
            setEditing={setEditing}
            navigate={navigate}
          />
          {/* Inline notification preview when a segment is selected */}
          {selectedSegment && selectedSegData && (
            <SegmentNotifPreview
              segmentId={selectedSegment}
              segmentName={selectedSegData.segment_name}
            />
          )}
        </div>
      ) : (
        <SegmentOverview
          segments={segments}
          stories={stories}
          onSegmentTypeClick={setSelectedSegmentType}
        />
      )}
    </>
  );
}
