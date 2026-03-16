import { useState, useEffect } from "react";
import {
  Users,
  CalendarClock,
  Send,
  Clock,
  Loader2,
  Play,
  Zap,
  FlaskConical,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";

function KpiCard({ icon: Icon, value, label, sublabel, color }) {
  return (
    <div className="glass-card rounded-xl p-5 hover-lift">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function SectionCard({ title, children, className = "", action }) {
  return (
    <div className={`glass-card rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function JourneyRow({ journey, onSelect, isSelected }) {
  const dayColor = journey.current_day === 0
    ? "text-emerald-400"
    : journey.current_day <= 3
    ? "text-amber-400"
    : "text-zinc-400";

  return (
    <tr
      className={`border-b border-brand-500/5 cursor-pointer transition-colors ${
        isSelected ? "bg-brand-600/10" : "hover:bg-brand-600/5"
      }`}
      onClick={() => onSelect(journey.identity)}
    >
      <td className="py-2.5 pr-3">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 font-mono truncate max-w-[140px]">
          {journey.identity}
        </p>
      </td>
      <td className="py-2.5 pr-3">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">
          {journey.username || "-"}
        </p>
      </td>
      <td className="py-2.5 pr-3 text-center">
        <span className={`text-sm font-semibold tabular-nums ${dayColor}`}>
          Day {journey.current_day}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        <span className="text-xs text-zinc-500 tabular-nums">
          {journey.payment_time
            ? new Date(journey.payment_time).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-center">
        <span className="text-sm text-zinc-700 dark:text-zinc-300 tabular-nums">
          {journey.lessons_completed || 0}
        </span>
      </td>
      <td className="py-2.5 pr-3">
        <span className="text-xs text-zinc-500 truncate max-w-[100px] block">
          {journey.first_event || "-"}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-center">
        <Badge variant={journey.pending_count > 0 ? "amber" : "default"}>
          {journey.pending_count || 0}
        </Badge>
      </td>
      <td className="py-2.5 text-center">
        <Badge variant="green">{journey.sent_count || 0}</Badge>
      </td>
    </tr>
  );
}

function SentLogRow({ log }) {
  const statusVariant = log.status === "delivered" ? "green" : log.status === "failed" ? "red" : "amber";
  const StatusIcon = log.status === "delivered" ? CheckCircle2 : log.status === "failed" ? XCircle : AlertCircle;

  return (
    <tr className="border-b border-brand-500/5 hover:bg-brand-600/5 transition-colors">
      <td className="py-2 pr-3">
        <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
          {log.sent_at
            ? new Date(log.sent_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate max-w-[120px] block">
          {log.username || log.identity}
        </span>
      </td>
      <td className="py-2 pr-3 text-center">
        <span className="text-xs text-zinc-500 tabular-nums">#{log.slot}</span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[120px] block">
          {log.notification_name || "-"}
        </span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[180px] block">
          {log.title || "-"}
        </span>
      </td>
      <td className="py-2">
        <Badge variant={statusVariant}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {log.status}
        </Badge>
      </td>
    </tr>
  );
}

function TestDay0Form({ onSubmit, loading }) {
  const [identity, setIdentity] = useState("");
  const [username, setUsername] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!identity.trim()) {
      toast.error("Identity (phone number) is required");
      return;
    }
    onSubmit({ identity: identity.trim(), username: username.trim() || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Identity (Phone)
        </label>
        <input
          type="text"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="e.g. +919876543210"
          className="w-full mt-1 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus-neon"
        />
      </div>
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Username (optional)
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. Ravi"
          className="w-full mt-1 bg-zinc-100/80 dark:bg-zinc-800/60 border border-brand-500/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus-neon"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 transition-colors disabled:opacity-50 w-full justify-center"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
        Send Test Day 0
      </button>
    </form>
  );
}

export default function AutomationDashboard() {
  const [journeys, setJourneys] = useState([]);
  const [sentLog, setSentLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [selectedJourneyDetail, setSelectedJourneyDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [testDay0Loading, setTestDay0Loading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [j, logs] = await Promise.all([
        api.getJourneys(),
        api.getSentLog(50),
      ]);
      setJourneys(j);
      setSentLog(logs);
    } catch {
      // may be empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSelectJourney(identity) {
    if (selectedIdentity === identity) {
      setSelectedIdentity(null);
      setSelectedJourneyDetail(null);
      return;
    }
    setSelectedIdentity(identity);
    try {
      const detail = await api.getJourney(identity);
      setSelectedJourneyDetail(detail);
    } catch {
      setSelectedJourneyDetail(null);
    }
  }

  async function handleDailyCheck() {
    setActionLoading("daily");
    try {
      const result = await api.runDailyCheck();
      toast.success(`Daily check complete: ${result.users_processed || 0} users processed`);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleProcessPending() {
    setActionLoading("pending");
    try {
      const result = await api.processPending();
      toast.success(`Processed ${result.processed || 0} pending notifications`);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTestDay0(data) {
    setTestDay0Loading(true);
    try {
      const result = await api.testDay0(data);
      toast.success(`Sent ${result.total_sent || 0} of ${result.total_scheduled || 0} Day 0 notifications`);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTestDay0Loading(false);
    }
  }

  // Compute stats
  const totalUsers = journeys.length;
  const activeDay0 = journeys.filter((j) => j.current_day === 0).length;
  const totalSent = journeys.reduce((sum, j) => sum + (j.sent_count || 0), 0);
  const totalPending = journeys.reduce((sum, j) => sum + (j.pending_count || 0), 0);

  if (loading) {
    return (
      <>
        <PageHeader title="Automation Monitor" description="Track user journeys, sent notifications, and trigger actions." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Automation Monitor"
        description="Track user journeys, sent notifications, and trigger actions."
        action={
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-400 bg-brand-600/10 border border-brand-500/15 hover:bg-brand-600/20 hover:shadow-neon-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      {/* Section 1: Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={Users}
          value={totalUsers}
          label="Total Users Tracked"
          color="bg-brand-600/15 text-brand-400"
        />
        <KpiCard
          icon={CalendarClock}
          value={activeDay0}
          label="Active Day 0 Users"
          sublabel="Current day = 0"
          color="bg-emerald-600/15 text-emerald-400"
        />
        <KpiCard
          icon={Send}
          value={totalSent}
          label="Notifications Sent"
          sublabel="Delivered total"
          color="bg-cyan-600/15 text-cyan-400"
        />
        <KpiCard
          icon={Clock}
          value={totalPending}
          label="Pending Notifications"
          sublabel="Awaiting delivery"
          color="bg-amber-600/15 text-amber-400"
        />
      </div>

      {/* Section 2: User Journeys Table */}
      <SectionCard title="User Journeys" className="mb-6">
        {journeys.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No user journeys yet"
            description="User journeys will appear here when events are received via webhooks."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-500/10 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-2 pr-3 font-medium">Identity</th>
                  <th className="text-left py-2 pr-3 font-medium">Username</th>
                  <th className="text-center py-2 pr-3 font-medium">Day</th>
                  <th className="text-left py-2 pr-3 font-medium">Payment Time</th>
                  <th className="text-center py-2 pr-3 font-medium">Lessons</th>
                  <th className="text-left py-2 pr-3 font-medium">Last Event</th>
                  <th className="text-center py-2 pr-3 font-medium">Pending</th>
                  <th className="text-center py-2 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody>
                {journeys.map((j) => (
                  <JourneyRow
                    key={j.identity}
                    journey={j}
                    onSelect={handleSelectJourney}
                    isSelected={selectedIdentity === j.identity}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded detail for selected journey */}
        {selectedIdentity && selectedJourneyDetail && (
          <div className="mt-4 p-4 rounded-lg bg-brand-600/5 border border-brand-500/15">
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown className="w-4 h-4 text-brand-400" />
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                Journey Detail: {selectedIdentity}
              </p>
            </div>

            {/* Scheduled notifications */}
            {selectedJourneyDetail.scheduled && selectedJourneyDetail.scheduled.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Scheduled Notifications</p>
                <div className="space-y-1.5">
                  {selectedJourneyDetail.scheduled.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                      <Badge variant={s.status === "pending" ? "amber" : s.status === "sent" ? "green" : "default"}>
                        {s.status}
                      </Badge>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{s.notification_name || `Slot #${s.slot}`}</span>
                      <span className="text-[10px] text-zinc-500 ml-auto tabular-nums">
                        {s.send_at ? new Date(s.send_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent sent log for this user */}
            {selectedJourneyDetail.sent_log && selectedJourneyDetail.sent_log.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Sent History</p>
                <div className="space-y-1.5">
                  {selectedJourneyDetail.sent_log.slice(0, 10).map((log, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                      <Badge variant={log.status === "delivered" ? "green" : "red"}>
                        {log.status}
                      </Badge>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[200px]">{log.title || log.notification_name}</span>
                      <span className="text-[10px] text-zinc-500 ml-auto tabular-nums">
                        {log.sent_at ? new Date(log.sent_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Section 3: Recent Sent Log */}
      <SectionCard title="Recent Sent Log" className="mb-6">
        {sentLog.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">No sent notifications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-500/10 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-2 pr-3 font-medium">Time</th>
                  <th className="text-left py-2 pr-3 font-medium">User</th>
                  <th className="text-center py-2 pr-3 font-medium">Slot</th>
                  <th className="text-left py-2 pr-3 font-medium">Name</th>
                  <th className="text-left py-2 pr-3 font-medium">Title</th>
                  <th className="text-left py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sentLog.map((log, i) => (
                  <SentLogRow key={i} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Section 4: Quick Actions */}
      <SectionCard title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Run Daily Check */}
          <div className="rounded-lg border border-brand-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Run Daily Check</p>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Trigger the daily morning check to advance user journeys and schedule notifications.
            </p>
            <button
              onClick={handleDailyCheck}
              disabled={actionLoading === "daily"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-600/10 border border-emerald-500/15 hover:bg-emerald-600/20 transition-all disabled:opacity-50 w-full justify-center"
            >
              {actionLoading === "daily" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Now
            </button>
          </div>

          {/* Process Pending */}
          <div className="rounded-lg border border-brand-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Process Pending</p>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Send all pending notifications that are due now.
            </p>
            <button
              onClick={handleProcessPending}
              disabled={actionLoading === "pending"}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-400 bg-amber-600/10 border border-amber-500/15 hover:bg-amber-600/20 transition-all disabled:opacity-50 w-full justify-center"
            >
              {actionLoading === "pending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Process Now
            </button>
          </div>

          {/* Test Day 0 */}
          <div className="rounded-lg border border-brand-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="w-4 h-4 text-brand-400" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Test Day 0</p>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Fire all Day 0 notifications immediately for a test user.
            </p>
            <TestDay0Form onSubmit={handleTestDay0} loading={testDay0Loading} />
          </div>
        </div>
      </SectionCard>
    </>
  );
}
