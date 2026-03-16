import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Send,
  Bell,
  Users,
  BookOpen,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import { api } from "../lib/api";
import { useTheme } from "../context/ThemeContext";

function KpiCard({ icon: Icon, value, label, sublabel, color, trend }) {
  return (
    <div className="glass-card rounded-xl p-5 hover-lift">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          }`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`glass-card rounded-xl p-5 ${className}`}>
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [bySegment, setBySegment] = useState([]);
  const [byLanguage, setByLanguage] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [topNotifs, setTopNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const axisColor = isDark ? "#71717a" : "#71717a";
  const gridColor = isDark ? "rgba(113, 113, 122, 0.15)" : "rgba(0, 0, 0, 0.1)";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)";

  async function loadAll() {
    setLoading(true);
    try {
      const [ov, seg, lang, tl, top] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAnalyticsBySegment(),
        api.getAnalyticsByLanguage(),
        api.getAnalyticsTimeline(),
        api.getTopNotifications(),
      ]);
      setOverview(ov);
      setBySegment(seg);
      setByLanguage(lang);
      setTimeline(tl);
      setTopNotifs(top);
    } catch {
      // Analytics may not have data yet
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      const result = await api.seedAnalytics();
      toast.success(result.message);
      loadAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSeeding(false);
    }
  }

  const LANG_COLORS = { English: "#3b82f6", Hindi: "#f59e0b", Hinglish: "#ec4899" };
  const FUNNEL_COLORS = ["#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b"];

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Analytics overview of your notification campaigns." />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      </>
    );
  }

  const hasData = overview && overview.events.sent > 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Analytics overview of your notification campaigns."
        action={
          !hasData && overview && overview.notifications > 0 ? (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-400 bg-brand-600/10 border border-brand-500/15 hover:bg-brand-600/20 hover:shadow-neon-sm transition-all disabled:opacity-50"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Sample Analytics
            </button>
          ) : null
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          icon={Send}
          value={overview?.events.sent || 0}
          label="Total Sent"
          color="bg-brand-600/15 text-brand-400"
          trend={12.5}
        />
        <KpiCard
          icon={Bell}
          value={overview?.events.delivered || 0}
          label="Delivered"
          sublabel={overview?.events.sent ? `${((overview.events.delivered / overview.events.sent) * 100).toFixed(1)}% delivery rate` : undefined}
          color="bg-cyan-600/15 text-cyan-400"
          trend={8.2}
        />
        <KpiCard
          icon={TrendingUp}
          value={overview?.events.opened || 0}
          label="Opened"
          sublabel={overview?.events.delivered ? `${((overview.events.opened / overview.events.delivered) * 100).toFixed(1)}% open rate` : undefined}
          color="bg-emerald-600/15 text-emerald-400"
          trend={5.4}
        />
        <KpiCard
          icon={MousePointerClick}
          value={overview?.events.clicked || 0}
          label="Clicked"
          sublabel={overview?.events.opened ? `${((overview.events.clicked / overview.events.opened) * 100).toFixed(1)}% CTR` : undefined}
          color="bg-amber-600/15 text-amber-400"
          trend={-2.1}
        />
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button onClick={() => navigate("/stories")} className="glass-card rounded-xl p-4 hover-lift text-left group">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-brand-400" />
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{overview?.stories || 0}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-brand-400 transition-colors">Stories <ArrowRight className="w-3 h-3 inline" /></p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate("/segments")} className="glass-card rounded-xl p-4 hover-lift text-left group">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{overview?.segments || 0}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-400 transition-colors">Segments <ArrowRight className="w-3 h-3 inline" /></p>
            </div>
          </div>
        </button>
        <button onClick={() => navigate("/notifications")} className="glass-card rounded-xl p-4 hover-lift text-left group">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{overview?.notifications || 0}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-amber-400 transition-colors">Notifications <ArrowRight className="w-3 h-3 inline" /></p>
            </div>
          </div>
        </button>
      </div>

      {hasData && (
        <>
          {/* Charts Row 1: Funnel + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartCard title="Delivery Funnel">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { name: "Sent", value: overview.events.sent },
                  { name: "Delivered", value: overview.events.delivered },
                  { name: "Opened", value: overview.events.opened },
                  { name: "Clicked", value: overview.events.clicked },
                ]} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} width={70} />
                  <Tooltip
                    contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v) => [v.toLocaleString(), "Count"]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {FUNNEL_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Performance Over Time">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={timeline} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="sent" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Sent" />
                  <Line type="monotone" dataKey="delivered" stroke="#06b6d4" strokeWidth={2} dot={false} name="Delivered" />
                  <Line type="monotone" dataKey="opened" stroke="#22c55e" strokeWidth={2} dot={false} name="Opened" />
                  <Line type="monotone" dataKey="clicked" stroke="#f59e0b" strokeWidth={2} dot={false} name="Clicked" />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Charts Row 2: By Language + Segment Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartCard title="Performance by Language">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byLanguage} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="language" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="total_opened" name="Opened" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_clicked" name="Clicked" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Language Distribution">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={byLanguage.map(l => ({ name: l.language, value: l.total_sent }))}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value"
                  >
                    {byLanguage.map((l, i) => (
                      <Cell key={i} fill={LANG_COLORS[l.language] || "#8b5cf6"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "8px", fontSize: "12px" }} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Segment Performance Table */}
          <ChartCard title="Segment Performance" className="mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-500/10 text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left py-2 pr-4 font-medium">Segment</th>
                    <th className="text-right py-2 pr-4 font-medium">Sent</th>
                    <th className="text-right py-2 pr-4 font-medium">Delivered</th>
                    <th className="text-right py-2 pr-4 font-medium">Opened</th>
                    <th className="text-right py-2 pr-4 font-medium">Clicked</th>
                    <th className="text-right py-2 pr-4 font-medium">Open Rate</th>
                    <th className="text-right py-2 font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {bySegment.map((seg) => (
                    <tr key={seg.segment_name} className="border-b border-brand-500/5 hover:bg-brand-600/5 transition-colors">
                      <td className="py-2.5 pr-4">
                        <Badge variant="purple">{seg.segment_name}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{seg.total_sent?.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{seg.total_delivered?.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{seg.total_opened?.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">{seg.total_clicked?.toLocaleString()}</td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className={`text-xs font-semibold ${parseFloat(seg.open_rate) > 25 ? "text-emerald-400" : parseFloat(seg.open_rate) > 15 ? "text-amber-400" : "text-red-400"}`}>
                          {seg.open_rate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`text-xs font-semibold ${parseFloat(seg.ctr) > 40 ? "text-emerald-400" : parseFloat(seg.ctr) > 25 ? "text-amber-400" : "text-red-400"}`}>
                          {seg.ctr}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Top Performing Notifications */}
          {topNotifs.length > 0 && (
            <ChartCard title="Top Performing Notifications">
              <div className="space-y-2">
                {topNotifs.slice(0, 5).map((n, i) => (
                  <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-600/5 transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-zinc-400/20 text-zinc-400" : i === 2 ? "bg-amber-700/20 text-amber-600" : "bg-zinc-600/10 text-zinc-500"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{n.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={n.language === "English" ? "blue" : n.language === "Hindi" ? "amber" : "pink"}>{n.language}</Badge>
                        <span className="text-[10px] text-zinc-500">{n.segment_name}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-emerald-400">{n.open_rate}%</p>
                      <p className="text-[10px] text-zinc-500">open rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </>
      )}

      {!hasData && (
        <div className="glass-card rounded-xl p-10 text-center">
          <BarChart3 className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-2">No analytics data yet</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-4">
            {overview && overview.notifications > 0
              ? "Click 'Generate Sample Analytics' above to simulate performance data for your existing notifications."
              : "Upload a CSV and generate notifications first, then analytics data will be available."}
          </p>
          {overview && overview.notifications === 0 && (
            <button onClick={() => navigate("/upload")} className="text-sm font-medium text-brand-400 hover:text-brand-300">
              Go to Upload Portal &rarr;
            </button>
          )}
        </div>
      )}
    </>
  );
}