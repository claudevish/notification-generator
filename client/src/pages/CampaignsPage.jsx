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

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getNotifications({});
        setNotifications(data);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreate() {
    if (!name.trim() || selectedIds.length === 0) {
      toast.error("Enter a name and select at least one notification");
      return;
    }
    setCreating(true);
    try {
      await onCreate({ name, notification_ids: selectedIds });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-surface rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Create Campaign</h2>

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
            <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin">
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
            onClick={handleCreate}
            disabled={creating || !name.trim() || selectedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Campaign
          </button>
        </div>
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