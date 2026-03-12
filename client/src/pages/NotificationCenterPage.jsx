import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BellRing, Loader2, Copy, Image, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import NotificationCard from "../components/NotificationCard";
import PhonePreview from "../components/PhonePreview";
import { api } from "../lib/api";

export default function NotificationCenterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [stories, setStories] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get("batch_id") || "");
  const [selectedStory, setSelectedStory] = useState(searchParams.get("story_id") || "");
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(searchParams.get("segment_id") || "");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewNotif, setPreviewNotif] = useState(null);
  const [langTab, setLangTab] = useState("English");
  const [showPrompt, setShowPrompt] = useState(null);

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

  // Load segments when story changes
  useEffect(() => {
    const params = {};
    if (selectedStory) params.story_id = selectedStory;
    api.getSegments(params).then(setSegments).catch(() => {});
  }, [selectedStory]);

  // Load notifications
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (selectedBatch) params.batch_id = selectedBatch;
    if (selectedStory) params.story_id = selectedStory;
    if (selectedSegment) params.segment_id = selectedSegment;
    if (langTab !== "All") params.language = langTab;

    api
      .getNotifications(params)
      .then((data) => {
        setNotifications(data);
        if (data.length > 0 && !previewNotif) setPreviewNotif(data[0]);
      })
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setLoading(false));
  }, [selectedBatch, selectedStory, selectedSegment, langTab]);

  async function handleRegenerate(id) {
    try {
      const updated = await api.regenerateNotification(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
      if (previewNotif?.id === id) setPreviewNotif({ ...previewNotif, ...updated });
      toast.success("Regenerated!");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleUpdate(id, data) {
    try {
      await api.updateNotification(id, data);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data } : n))
      );
      if (previewNotif?.id === id) setPreviewNotif({ ...previewNotif, ...data });
      toast.success("Updated!");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function copyPrompt(text) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }

  // Group notifications by segment
  const grouped = notifications.reduce((acc, n) => {
    const key = n.segment_id;
    if (!acc[key]) acc[key] = { name: n.segment_name, story: n.story_title, items: [] };
    acc[key].items.push(n);
    return acc;
  }, {});

  const currentStory = stories.find((s) => String(s.id) === selectedStory);

  return (
    <>
      <PageHeader
        title="Notification Center"
        description={
          currentStory
            ? `Notifications for "${currentStory.title}"`
            : "Preview and manage generated notifications across all stories."
        }
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Batch filter */}
        <div className="relative">
          <select
            value={selectedBatch}
            onChange={(e) => {
              setSelectedBatch(e.target.value);
              setSelectedStory("");
              setSelectedSegment("");
              setPreviewNotif(null);
            }}
            className="appearance-none glass-card rounded-lg pl-3 pr-8 py-2 text-sm text-zinc-200 focus-neon cursor-pointer"
          >
            <option value="">All Uploads</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>

        {/* Story filter */}
        <select
          value={selectedStory}
          onChange={(e) => {
            setSelectedStory(e.target.value);
            setSelectedSegment("");
            setPreviewNotif(null);
          }}
          className="glass-card rounded-lg px-3 py-2 text-sm text-zinc-200 focus-neon"
        >
          <option value="">All Stories</option>
          {stories
            .filter((s) => s.segments_count > 0)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
        </select>

        {/* Segment filter */}
        <select
          value={selectedSegment}
          onChange={(e) => {
            setSelectedSegment(e.target.value);
            setPreviewNotif(null);
          }}
          className="glass-card rounded-lg px-3 py-2 text-sm text-zinc-200 focus-neon"
        >
          <option value="">All Segments</option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.segment_name}
            </option>
          ))}
        </select>

        {/* Language tabs */}
        <div className="flex glass-card rounded-lg overflow-hidden ml-auto">
          {["English", "Hindi", "Hinglish", "All"].map((lang) => (
            <button
              key={lang}
              onClick={() => setLangTab(lang)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                langTab === lang
                  ? "bg-brand-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="No notifications to preview"
          description="Generate segments and notifications first."
          action={
            <button onClick={() => navigate("/stories")} className="text-sm font-medium text-brand-400">
              Go to Stories &rarr;
            </button>
          }
        />
      ) : (
        <div className="flex gap-6">
          {/* Left: notification list */}
          <div className="flex-1 space-y-6 min-w-0">
            {Object.entries(grouped).map(([segId, group]) => (
              <div key={segId}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    {group.name}
                  </h3>
                  <span className="text-[10px] text-zinc-600">{group.story}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((n) => (
                    <div key={n.id}>
                      <div
                        onClick={() => setPreviewNotif(n)}
                        className={`cursor-pointer rounded-xl transition-all ${
                          previewNotif?.id === n.id ? "ring-2 ring-brand-500" : ""
                        }`}
                      >
                        <NotificationCard
                          notification={n}
                          onRegenerate={handleRegenerate}
                          onUpdate={handleUpdate}
                        />
                      </div>
                      {/* Image prompt */}
                      {n.image_prompt && (
                        <div className="mt-1.5">
                          <button
                            onClick={() => setShowPrompt(showPrompt === n.id ? null : n.id)}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-400"
                          >
                            <Image className="w-3 h-3" />
                            Image prompt
                            <ChevronDown className={`w-3 h-3 transition-transform ${showPrompt === n.id ? "rotate-180" : ""}`} />
                          </button>
                          {showPrompt === n.id && (
                            <div className="mt-1 glass-card rounded-md p-2 relative group">
                              <p className="text-[10px] text-zinc-400 leading-relaxed pr-6">
                                {n.image_prompt}
                              </p>
                              <button
                                onClick={() => copyPrompt(n.image_prompt)}
                                className="absolute top-1.5 right-1.5 p-1 rounded text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Copy prompt"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right: preview panel */}
          <div className="hidden lg:block w-[420px] flex-shrink-0 sticky top-8 self-start space-y-4">
            {/* Generated notification image (984x360) */}
            {previewNotif?.image_url && (
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Notification Image (984x360)
                </p>
                <div className="rounded-xl overflow-hidden border border-brand-500/10 shadow-neon-sm">
                  <img
                    src={previewNotif.image_url}
                    alt={`${previewNotif.title} preview`}
                    className="w-full h-auto"
                    key={previewNotif.id}
                  />
                </div>
              </div>
            )}

            {/* Phone mockup preview */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Phone Preview
              </p>
              <PhonePreview notification={previewNotif} />
            </div>

            {/* Image prompt */}
            {previewNotif?.image_prompt && (
              <div className="glass-card rounded-xl p-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5">
                  AI Image Prompt
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {previewNotif.image_prompt}
                </p>
                <button
                  onClick={() => copyPrompt(previewNotif.image_prompt)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-medium text-brand-400 hover:text-brand-300"
                >
                  <Copy className="w-3 h-3" />
                  Copy prompt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
