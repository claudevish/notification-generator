import { useState, useEffect } from "react";
import { Users, BookOpen, TrendingUp, Clock, Loader2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import EngagementChart from "../components/user-analytics/EngagementChart";
import FunnelChart from "../components/user-analytics/FunnelChart";
import StoryPerformanceChart from "../components/user-analytics/StoryPerformanceChart";
import ActivityHeatmap from "../components/user-analytics/ActivityHeatmap";
import CohortTable from "../components/user-analytics/CohortTable";
import NotificationImpactChart from "../components/user-analytics/NotificationImpactChart";
import TopUsersTable from "../components/user-analytics/TopUsersTable";

export default function UserAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [engagement, setEngagement] = useState([]);
  const [stories, setStories] = useState([]);
  const [heatmapData, setHeatmapData] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const axisColor = "#71717a";
  const gridColor = isDark ? "rgba(113, 113, 122, 0.15)" : "rgba(0, 0, 0, 0.1)";
  const tooltipBg = isDark ? "#18181b" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)";

  useEffect(() => {
    async function loadAll() {
      try {
        const [ov, eng, st, hm, tu] = await Promise.all([
          api.getUserAnalyticsOverview(),
          api.getUserEngagement(),
          api.getUserStoryPerformance(),
          api.getUserHeatmapData(),
          api.getTopUsers(),
        ]);
        setOverview(ov);
        setEngagement(eng);
        setStories(st);
        setHeatmapData(hm);
        setTopUsers(tu);
      } catch (err) {
        // API may not be available yet
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="User Analytics" description="Track user engagement, lesson completion, and notification impact" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      </>
    );
  }

  const kpi = overview?.kpi || {};
  const funnel = overview?.funnel || [];

  const kpiCards = [
    {
      icon: Users,
      label: "Total Users",
      value: kpi.totalUsers || 0,
      trend: kpi.trends?.totalUsers,
      bgColor: "rgba(139, 92, 246, 0.15)",
      iconColor: "#a78bfa",
    },
    {
      icon: BookOpen,
      label: "Avg Lessons Completed",
      value: kpi.avgLessonsCompleted || 0,
      trend: kpi.trends?.avgLessons,
      bgColor: "rgba(6, 182, 212, 0.15)",
      iconColor: "#22d3ee",
    },
    {
      icon: TrendingUp,
      label: "Engagement Rate",
      value: (kpi.engagementRate || 0) + "%",
      trend: kpi.trends?.engagement,
      bgColor: "rgba(34, 197, 94, 0.15)",
      iconColor: "#4ade80",
    },
    {
      icon: Clock,
      label: "Avg Time Spent",
      value: kpi.avgTimeSpent || "0 min",
      trend: kpi.trends?.timeSpent,
      bgColor: "rgba(245, 158, 11, 0.15)",
      iconColor: "#fbbf24",
    },
  ];

  return (
    <>
      <PageHeader title="User Analytics" description="Track user engagement, lesson completion, and notification impact" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isPositive = card.trend >= 0;
          return (
            <div key={card.label} className="glass-card rounded-xl p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
                {card.trend !== undefined && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {isPositive ? "\u2191" : "\u2193"} {Math.abs(card.trend)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <EngagementChart
        data={engagement}
        axisColor={axisColor}
        gridColor={gridColor}
        tooltipBg={tooltipBg}
        tooltipBorder={tooltipBorder}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <FunnelChart
          data={funnel}
          axisColor={axisColor}
          gridColor={gridColor}
          tooltipBg={tooltipBg}
          tooltipBorder={tooltipBorder}
        />
        <StoryPerformanceChart
          data={stories}
          axisColor={axisColor}
          gridColor={gridColor}
          tooltipBg={tooltipBg}
          tooltipBorder={tooltipBorder}
        />
      </div>

      {heatmapData && <ActivityHeatmap data={heatmapData.heatmap} />}
      {heatmapData && <CohortTable data={heatmapData.cohort} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {heatmapData && (
          <NotificationImpactChart
            data={heatmapData.notificationImpact}
            axisColor={axisColor}
            gridColor={gridColor}
            tooltipBg={tooltipBg}
            tooltipBorder={tooltipBorder}
          />
        )}
        <TopUsersTable data={topUsers} />
      </div>
    </>
  );
}
