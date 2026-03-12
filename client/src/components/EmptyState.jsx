export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-xl glass-card flex items-center justify-center">
            <Icon className="w-7 h-7 text-brand-400" />
          </div>
          <div className="absolute inset-0 w-14 h-14 rounded-xl bg-brand-500/10 animate-glow-pulse" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-zinc-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
