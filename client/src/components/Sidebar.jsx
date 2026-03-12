import { NavLink } from "react-router-dom";
import {
  Zap,
  BookOpen,
  Users,
  Palette,
  BellRing,
  Download,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: Zap, label: "Portal" },
  { to: "/stories", icon: BookOpen, label: "Stories" },
  { to: "/segments", icon: Users, label: "Segments" },
  { to: "/themes", icon: Palette, label: "Themes" },
  { to: "/notifications", icon: BellRing, label: "Notification Center" },
  { to: "/export", icon: Download, label: "Export" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 glass-surface flex flex-col z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-brand-500/10">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-neon-cyan flex items-center justify-center shadow-neon-sm">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="absolute inset-0 w-8 h-8 rounded-lg bg-brand-500/20 animate-glow-pulse" />
        </div>
        <span className="text-base font-semibold text-gradient tracking-tight">
          NotifyGen
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-brand-600/15 text-brand-400 shadow-neon-sm border border-brand-500/15"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-brand-500/10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-glow-pulse" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
            System Active
          </span>
        </div>
      </div>
    </aside>
  );
}
