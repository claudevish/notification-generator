import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Palette,
  Loader2,
  ChevronDown,
  ChevronRight,
  BellRing,
  UserPlus,
  PlayCircle,
  Moon,
  TrendingDown,
  Clock,
  AlertTriangle,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import { api } from "../lib/api";

const VISUAL_THEMES = [
  {
    key: "new_users",
    segmentName: "New users who haven't started lessons",
    label: "Word of the Day",
    description: "Purple gradient banner with phone illustration. Encourages new users to start their first lesson.",
    icon: UserPlus,
    color: "#8b5cf6",
    gradient: "from-violet-900/40 to-violet-800/20",
    border: "border-violet-600/30",
    hoverBorder: "hover:border-violet-500/50",
  },
  {
    key: "started_not_finished",
    segmentName: "Users who started but didn't finish",
    label: "English Challenge",
    description: "Dark red/burgundy banner with LIVE badge and checklist. Motivates users to complete in-progress lessons.",
    icon: PlayCircle,
    color: "#ef4444",
    gradient: "from-red-900/40 to-red-800/20",
    border: "border-red-600/30",
    hoverBorder: "hover:border-red-500/50",
  },
  {
    key: "low_practice",
    segmentName: "Users with less than 50% practice",
    label: "Practice Booster",
    description: "Blue/indigo banner with lightbulb and highlighted 'English' text. Encourages more practice sessions.",
    icon: TrendingDown,
    color: "#3b82f6",
    gradient: "from-blue-900/40 to-blue-800/20",
    border: "border-blue-600/30",
    hoverBorder: "hover:border-blue-500/50",
  },
  {
    key: "inactive_3d",
    segmentName: "Users inactive for 3 days",
    label: "Tip of the Day",
    description: "Bright yellow banner with pencil illustration. Re-engages users after 3 days of inactivity.",
    icon: Clock,
    color: "#eab308",
    gradient: "from-yellow-900/40 to-yellow-800/20",
    border: "border-yellow-600/30",
    hoverBorder: "hover:border-yellow-500/50",
  },
  {
    key: "inactive_7d",
    segmentName: "Users inactive for 7 days",
    label: "Congratulations",
    description: "Dark + gold split banner with trophy illustration. Creates urgency for 7-day inactive users.",
    icon: AlertTriangle,
    color: "#f97316",
    gradient: "from-orange-900/40 to-orange-800/20",
    border: "border-orange-600/30",
    hoverBorder: "hover:border-orange-500/50",
  },
  {
    key: "dormant",
    segmentName: "Dormant users (no activity 7+ days)",
    label: "Unlock New Topic",
    description: "Light mint/green banner with lock illustration. Re-engages long-dormant users with new content.",
    icon: Moon,
    color: "#22c55e",
    gradient: "from-emerald-900/40 to-emerald-800/20",
    border: "border-emerald-600/30",
    hoverBorder: "hover:border-emerald-500/50",
  },
];

function getTheme(key) {
  return VISUAL_THEMES.find((vt) => vt.key === key);
}

/* ─── Overview: all 6 theme cards ─── */
function ThemesOverview({ notifications, stories, onSelectTheme }) {
  const storiesWithSegs = stories.filter((s) => s.segments_count > 0).length;

  const themeCounts = {};
  for (const vt of VISUAL_THEMES) themeCounts[vt.segmentName] = 0;
  for (const n of notifications) {
    if (themeCounts[n.segment_name] !== undefined) themeCounts[n.segment_name]++;
  }

  const themeImages = {};
  for (const n of notifications) {
    if (n.image_url && !themeImages[n.segment_name]) themeImages[n.segment_name] = n.image_url;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Visual Themes", value: VISUAL_THEMES.length, color: "text-brand-400" },
          { label: "Stories Using Themes", value: storiesWithSegs, color: "text-emerald-400" },
          { label: "Total Notifications", value: notifications.length, color: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <p className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Notification Visual Themes
        </h3>
        <div className="space-y-4">
          {VISUAL_THEMES.map((vt) => {
            const Icon = vt.icon;
            const count = themeCounts[vt.segmentName] || 0;
            const imageUrl = themeImages[vt.segmentName];
            return (
              <button
                key={vt.key}
                onClick={() => onSelectTheme(vt.key)}
                className={`w-full text-left bg-gradient-to-r ${vt.gradient} border ${vt.border} ${vt.hoverBorder} rounded-xl overflow-hidden transition-all hover:shadow-neon-sm group cursor-pointer`}
              >
                <div className="flex items-start gap-5 p-5">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: vt.color + "25" }}
                      >
                        <Icon className="w-4 h-4" style={{ color: vt.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-white transition-colors">
                          {vt.label}
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{vt.segmentName}</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{vt.description}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <Badge variant="default">{count} notifications</Badge>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        View details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                  {imageUrl && (
                    <div className="hidden sm:block w-56 flex-shrink-0">
                      <div className="rounded-lg overflow-hidden border border-brand-500/10 shadow-lg group-hover:border-brand-500/20 transition-colors">
                        <img src={imageUrl} alt={`${vt.label} preview`} className="w-full h-auto" loading="lazy" />
                      </div>
                    </div>
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

/* ─── Theme Detail: notifications grouped by story ─── */
function ThemeDetail({ themeKey, notifications, stories, navigate }) {
  const vt = getTheme(themeKey);
  if (!vt) return null;
  const Icon = vt.icon;

  // Filter notifications for this segment type
  const themeNotifs = notifications.filter((n) => n.segment_name === vt.segmentName);

  // Group by story
  const storyGroups = {};
  for (const n of themeNotifs) {
    const sid = n.story_id;
    if (!storyGroups[sid]) {
      storyGroups[sid] = {
        storyTitle: n.story_title,
        storyId: sid,
        notifications: [],
      };
    }
    storyGroups[sid].notifications.push(n);
  }

  const storyList = Object.values(storyGroups);
  const uniqueStoryCount = storyList.length;

  // Pick a sample image from the first English notification
  const sampleNotif = themeNotifs.find((n) => n.language === "English" && n.image_url) || themeNotifs[0];

  return (
    <div className="space-y-6">
      {/* Theme header card */}
      <div className={`bg-gradient-to-r ${vt.gradient} border ${vt.border} rounded-xl overflow-hidden`}>
        <div className="flex items-start gap-5 p-5">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: vt.color + "25" }}
              >
                <Icon className="w-5 h-5" style={{ color: vt.color }} />
              </div>
              <div>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{vt.label}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{vt.segmentName}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{vt.description}</p>
            <div className="flex items-center gap-3 pt-1">
              <Badge variant="default">{themeNotifs.length} notifications</Badge>
              <Badge variant="purple">{uniqueStoryCount} {uniqueStoryCount === 1 ? "story" : "stories"}</Badge>
            </div>
          </div>
          {sampleNotif?.image_url && (
            <div className="hidden sm:block w-64 flex-shrink-0">
              <div className="rounded-lg overflow-hidden border border-brand-500/10 shadow-xl">
                <img src={sampleNotif.image_url} alt={`${vt.label} preview`} className="w-full h-auto" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stories using this theme */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
          Stories using &ldquo;{vt.label}&rdquo; ({uniqueStoryCount})
        </h3>
        <div className="space-y-5">
          {storyList.map((group) => {
            const story = stories.find((s) => s.id === group.storyId);
            const englishNotif = group.notifications.find((n) => n.language === "English") || group.notifications[0];

            return (
              <div key={group.storyId} className="glass-card rounded-xl overflow-hidden">
                {/* Story header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 glass-surface">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{group.storyTitle}</p>
                    <Badge variant="default">{story?.difficulty || "N/A"}</Badge>
                  </div>
                  <button
                    onClick={() => navigate(`/notifications?story_id=${group.storyId}`)}
                    className="flex items-center gap-1 text-[10px] font-medium text-brand-400 hover:text-brand-300 flex-shrink-0 ml-3"
                  >
                    <BellRing className="w-3 h-3" />
                    View in Notification Center
                  </button>
                </div>

                {/* Notification image + language cards */}
                <div className="p-5 space-y-4">
                  {englishNotif?.image_url && (
                    <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 max-w-md">
                      <img src={englishNotif.image_url} alt={`${group.storyTitle} - ${vt.label}`} className="w-full h-auto" loading="lazy" />
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    {group.notifications.map((n) => (
                      <div key={n.id} className="glass-card rounded-lg p-3 space-y-1.5">
                        <Badge variant={n.language === "English" ? "blue" : n.language === "Hindi" ? "amber" : "pink"}>
                          {n.language}
                        </Badge>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{n.title}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{n.body}</p>
                        <span className="inline-block text-[10px] font-semibold text-brand-400 bg-brand-600/10 px-1.5 py-0.5 rounded">
                          {n.cta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Story Detail: all themes for one story ─── */
function StoryThemeDetail({ story, notifications }) {
  const segmentGroups = {};
  for (const n of notifications) {
    if (!segmentGroups[n.segment_name]) segmentGroups[n.segment_name] = [];
    segmentGroups[n.segment_name].push(n);
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="default">{story.difficulty || "N/A"}</Badge>
          <span className="text-[10px] text-zinc-500">{story.story_id}</span>
        </div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{story.title}</h3>
      </div>

      {VISUAL_THEMES.map((vt) => {
        const notifs = segmentGroups[vt.segmentName];
        if (!notifs || notifs.length === 0) return null;
        const Icon = vt.icon;
        const englishNotif = notifs.find((n) => n.language === "English") || notifs[0];

        return (
          <div key={vt.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: vt.color + "20" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: vt.color }} />
              </div>
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{vt.label}</h4>
              <span className="text-[10px] text-zinc-500">{vt.segmentName}</span>
            </div>
            {englishNotif?.image_url && (
              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-w-lg">
                <img src={englishNotif.image_url} alt={`${vt.label} notification`} className="w-full h-auto" loading="lazy" />
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              {notifs.map((n) => (
                <div key={n.id} className="glass-card rounded-lg p-3 space-y-1.5">
                  <Badge variant={n.language === "English" ? "blue" : n.language === "Hindi" ? "amber" : "pink"}>
                    {n.language}
                  </Badge>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{n.title}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{n.body}</p>
                  <span className="inline-block text-[10px] font-semibold text-brand-400 bg-brand-600/10 px-1.5 py-0.5 rounded">
                    {n.cta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ThemesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(searchParams.get("story_id") || "");
  const [selectedTheme, setSelectedTheme] = useState(searchParams.get("theme") || "");
  const [allNotifications, setAllNotifications] = useState([]);
  const [storyNotifications, setStoryNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [storiesData, notifsData] = await Promise.all([
          api.getStories(),
          api.getNotifications(),
        ]);
        setStories(storiesData);
        setAllNotifications(notifsData);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedStory) {
      setStoryNotifications([]);
      return;
    }
    setDetailLoading(true);
    api
      .getNotifications({ story_id: selectedStory })
      .then(setStoryNotifications)
      .catch(() => toast.error("Failed to load notifications"))
      .finally(() => setDetailLoading(false));
  }, [selectedStory]);

  function handleStoryChange(storyId) {
    setSelectedStory(storyId);
    setSelectedTheme("");
    const params = {};
    if (storyId) params.story_id = storyId;
    setSearchParams(params);
  }

  function handleThemeSelect(themeKey) {
    setSelectedTheme(themeKey);
    setSelectedStory("");
    setSearchParams({ theme: themeKey });
  }

  function handleBackToOverview() {
    setSelectedTheme("");
    setSelectedStory("");
    setSearchParams({});
  }

  const currentStory = stories.find((s) => String(s.id) === selectedStory);
  const currentTheme = getTheme(selectedTheme);

  // Determine page description
  let pageDescription = "Visual notification themes used across all stories.";
  if (currentStory) pageDescription = `Notification themes for "${currentStory.title}"`;
  else if (currentTheme) pageDescription = `All notifications using the "${currentTheme.label}" theme.`;

  // Determine active view
  const isOverview = !selectedStory && !selectedTheme;
  const isThemeView = !!selectedTheme && !selectedStory;
  const isStoryView = !!selectedStory;

  return (
    <>
      <PageHeader
        title="Themes"
        description={pageDescription}
        action={
          selectedStory && currentStory?.segments_count > 0 ? (
            <button
              onClick={() => navigate(`/notifications?story_id=${selectedStory}`)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-brand-400 bg-brand-600/10 hover:bg-brand-600/20 rounded-lg transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              View in Notification Center
            </button>
          ) : null
        }
      />

      {/* Filters / navigation */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <select
            value={selectedStory}
            onChange={(e) => handleStoryChange(e.target.value)}
            className="w-full appearance-none glass-card rounded-lg pl-3 pr-8 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus-neon cursor-pointer"
          >
            <option value="">{selectedTheme ? "Filter by story…" : "All Themes — Overview"}</option>
            {stories
              .filter((s) => s.segments_count > 0)
              .map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>

        {(selectedStory || selectedTheme) && (
          <button
            onClick={handleBackToOverview}
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            Back to overview
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : stories.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="No themes yet"
          description="Upload stories and generate notifications to see visual themes."
          action={
            <button onClick={() => navigate("/")} className="text-sm font-medium text-brand-400 hover:text-brand-300">
              Upload CSV &rarr;
            </button>
          }
        />
      ) : isStoryView && currentStory ? (
        detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : (
          <StoryThemeDetail story={currentStory} notifications={storyNotifications} />
        )
      ) : isThemeView ? (
        <ThemeDetail
          themeKey={selectedTheme}
          notifications={allNotifications}
          stories={stories}
          navigate={navigate}
        />
      ) : (
        <ThemesOverview
          notifications={allNotifications}
          stories={stories}
          onSelectTheme={handleThemeSelect}
        />
      )}
    </>
  );
}
