const VARIANTS = {
  default: "bg-zinc-800/60 text-zinc-300 border-zinc-700/50",
  purple: "bg-brand-600/10 text-brand-400 border-brand-500/20",
  green: "bg-emerald-600/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-600/10 text-amber-400 border-amber-500/20",
  blue: "bg-blue-600/10 text-blue-400 border-blue-500/20",
  red: "bg-red-600/10 text-red-400 border-red-500/20",
  pink: "bg-pink-600/10 text-pink-400 border-pink-500/20",
  cyan: "bg-cyan-600/10 text-cyan-400 border-cyan-500/20",
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border backdrop-blur-sm ${VARIANTS[variant] || VARIANTS.default} ${className}`}
    >
      {children}
    </span>
  );
}
