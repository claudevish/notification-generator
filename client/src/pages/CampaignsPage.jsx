import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Plus,
  Trash2,
  Loader2,
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronDown,
  Target,
  Zap,
  Users,
  Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";

const STATUS_VARIANT = {
  draft: "default",
  scheduled: "blue",
  sent: "green",
  failed: "red",
};

const STATUS_ICON = {
  draft: FileText,
  scheduled: Clock,
  sent: CheckCircle2,
  failed: XCircle,
};

function CreateCampaignModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1); // 1: basics, 2: targeting

  // Targeting state
  const [segmentMap, setSegmentMap] = useState({});
  const [channels, setChannels] = useState([]);
  const [targetingMode, setTargetingMode] = useState("segment"); // "segment" | "event" | "none"
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("general_updates");
  const [dateFrom, setDateFrom] = useState(7);
  const [dateTo, setDateTo] = useState(0);
  const [targetingPreview, setTargetingPreview] = useState(null);
  const [customEvents, setCustomEvents] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [notifs, segMap, chs, evts] = await Promise.all([
          api.getNotifications({}),
          api.getSegmentMap(),
          api.getEventChannels(),
          api.getCustomEvents(),
        ]);
        setNotifications(notifs);
        setSegmentMap(segMap);
        setChannels(chs);
        // Flatten custom events into a single list
        const allEvents = [];
        for (const [, events] of Object.entries(evts)) {
          for (const ev of events) {
            if (ev.this_month > 0) allEvents.push(ev);
          }
        }
        allEvents.sort((a, b) => b.this_month - a.this_month);
        setCustomEvents(allEvents);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (targetingMode === "segment" && selectedSegment && segmentMap[selectedSegment]) {
      const mapping = segmentMap[selectedSegment];
      setSelectedChannel(mapping.channel);
      setTargetingPreview(mapping);
    } else if (targetingMode === "event" && selectedEvent) {
      const ev = customEvents.find((e) => e.name === selectedEvent);
      setTargetingPreview({
        description: ev?.description || `Target users by "${selectedEvent}"`,
        primary_event: selectedEvent,
        supporting_events: [],
        channel: selectedChannel,
      });
    } else {
      setTargetingPreview(null);
    }
  }, [targetingMode, selectedSegment, selectedEvent, segmentMap, customEvents, selectedChannel]);

  async function handleCreate() {
    if (!name.trim() || selectedIds.length === 0) {
      toast.error("Enter a name and select at least one notification");
      return;
    }
    setCreating(true);
    try {
      let segment_targeting = null;
      if (targetingMode === "segment" && selectedSegment) {
        const result = await api.buildTargeting({
          segment_type: selectedSegment,
          date_range: { from: dateFrom, to: dateTo },
        });
        segment_targeting = { ...result.targeting, channel: result.channel };
      } else if (targetingMode === "event" && selectedEvent) {
        const result = await api.buildTargeting({
          event_name: selectedEvent,
          date_range: { from: dateFrom, to: dateTo },
        });
        segment_targeting = { ...result.targeting, channel: selectedChannel };
      }

      await onCreate({
        name,
        notification_ids: selectedIds,
        segment_targeting: segment_targeting || undefined,
      });
      onClose();
    } finally {
      setCreating(false);
    }
  }

  function toggleNotif(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function formatVolume(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-surface rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Create Campaign</h2>
          <div className="flex items-center gap-1 ml-auto">
            <span className={`w-2 h-2 rounded-full ${step >= 1 ? "bg-brand-500" : "bg-zinc-600"}`} />
            <span className={`w-2 h-2 rounded-full ${step >= 2 ? "bg-brand-500" : "bg-zinc-600"}`} />
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="mb-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Week 12 Engagement Push"
                className="w-full mt-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus-neon"
              />
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                Select Notifications ({selectedIds.length} selected)
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => toggleNotif(n.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all text-sm ${
                        selectedIds.includes(n.id)
                          ? "border-brand-500/30 bg-brand-600/10"
                          : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{n.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={n.language === "English" ? "blue" : n.language === "Hindi" ? "amber" : "pink"}>
                          {n.language}
                        </Badge>
                        <span className="text-[10px] text-zinc-500">{n.segment_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-500/10">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim() || selectedIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-50"
              >
                Next: Targeting <Target className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {/* Targeting Mode */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  <Target className="w-3 h-3 inline mr-1" /> Audience Targeting
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "segment", label: "By Segment", icon: Users, desc: "Pre-mapped user segments" },
                    { key: "event", label: "By Event", icon: Zap, desc: "CleverTap custom events" },
                    { key: "none", label: "All Users", icon: Bell, desc: "App Launched (last 7d)" },
                  ].map(({ key, label, icon: Icon, desc }) => (
                    <button
                      key={key}
                      onClick={() => setTargetingMode(key)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        targetingMode === key
                          ? "border-brand-500/40 bg-brand-600/10"
                          : "border-brand-500/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${targetingMode === key ? "text-brand-400" : "text-zinc-500"}`} />
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Segment Selector */}
              {targetingMode === "segment" && (
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Select Segment</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                    {Object.entries(segmentMap).map(([segName, mapping]) => (
                      <button
                        key={segName}
                        onClick={() => setSelectedSegment(segName)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                          selectedSegment === segName
                            ? "border-brand-500/30 bg-brand-600/10"
                            : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{segName}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-400">
                            {mapping.primary_event}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{mapping.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Selector */}
              {targetingMode === "event" && (
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Select Event</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
                    {customEvents.map((ev) => (
                      <button
                        key={ev.name}
                        onClick={() => setSelectedEvent(ev.name)}
                        className={`w-full text-left p-2 rounded-lg border transition-all ${
                          selectedEvent === ev.name
                            ? "border-brand-500/30 bg-brand-600/10"
                            : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 font-mono">{ev.name}</p>
                          <span className="text-[10px] text-emerald-400 font-semibold tabular-nums">{formatVolume(ev.this_month)}/mo</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{ev.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range & Channel */}
              {targetingMode !== "none" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">From (days ago)</label>
                    <input
                      type="number"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(parseInt(e.target.value) || 7)}
                      className="w-full mt-1 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus-neon"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">To (days ago)</label>
                    <input
                      type="number"
                      value={dateTo}
                      onChange={(e) => setDateTo(parseInt(e.target.value) || 0)}
                      className="w-full mt-1 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus-neon"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Channel</label>
                    <select
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-full mt-1 appearance-none bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus-neon cursor-pointer"
                    >
                      {channels.map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Targeting Preview */}
              {targetingPreview && (
                <div className="rounded-lg bg-brand-600/5 border border-brand-500/15 p-3">
                  <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-1.5">Targeting Preview</p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">{targetingPreview.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 font-medium">
                      {targetingPreview.primary_event}
                    </span>
                    {targetingPreview.supporting_events?.map((ev) => (
                      <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-500">
                        {ev}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">
                    Channel: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{targetingPreview.channel || selectedChannel}</span>
                    &nbsp;&middot;&nbsp; Window: last {dateFrom} days
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-brand-500/10">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                &larr; Back
              </button>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Campaign
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sending, setSending] = useState(null);

  async function loadCampaigns() {
    setLoading(true);
    try {
      setCampaigns(await api.getCampaigns());
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadCampaigns(); }, []);

  async function handleCreate(data) {
    try {
      await api.createCampaign(data);
      toast.success("Campaign created");
      loadCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSend(id) {
    setSending(id);
    try {
      await api.sendCampaign(id);
      toast.success("Campaign sent to CleverTap!");
      loadCampaigns();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this campaign?")) return;
    try {
      await api.deleteCampaign(id);
      toast.success("Campaign deleted");
      loadCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Create and manage CleverTap push notification campaigns."
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        }
      />

      {showCreate && (
        <CreateCampaignModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No campaigns yet"
          description="Create a campaign to group notifications and send them via CleverTap."
          action={
            <button onClick={() => setShowCreate(true)} className="text-sm font-medium text-brand-400 hover:text-brand-300">
              Create your first campaign &rarr;
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const StatusIcon = STATUS_ICON[campaign.status] || FileText;
            return (
              <div key={campaign.id} className="glass-card rounded-xl p-5 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{campaign.name}</h3>
                      <Badge variant={STATUS_VARIANT[campaign.status]}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {campaign.notification_ids.length} notification{campaign.notification_ids.length !== 1 ? "s" : ""} &middot; Created {new Date(campaign.created_at).toLocaleDateString()}
                      {campaign.segment_targeting && (() => {
                        try {
                          const t = typeof campaign.segment_targeting === "string" ? JSON.parse(campaign.segment_targeting) : campaign.segment_targeting;
                          return (
                            <span className="ml-1.5 inline-flex items-center gap-1 text-brand-400">
                              &middot; <Target className="w-3 h-3 inline" />
                              <span className="font-mono">{t.event_name || t.where?.event_name || "custom"}</span>
                              {t.channel && <span className="text-zinc-500">({t.channel})</span>}
                            </span>
                          );
                        } catch { return null; }
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {campaign.status === "draft" && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        disabled={sending === campaign.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-400 bg-brand-600/10 border border-brand-500/15 hover:bg-brand-600/20 hover:shadow-neon-sm transition-all disabled:opacity-50"
                      >
                        {sending === campaign.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                      aria-label="Delete campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                {(campaign.total_sent || 0) > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-brand-500/10">
                    <div>
                      <p className="text-xs text-zinc-500">Sent</p>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">{(campaign.total_sent || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Delivered</p>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tabular-nums">{(campaign.total_delivered || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Opened</p>
                      <p className="text-sm font-semibold text-emerald-400 tabular-nums">{(campaign.total_opened || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Clicked</p>
                      <p className="text-sm font-semibold text-amber-400 tabular-nums">{(campaign.total_clicked || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}