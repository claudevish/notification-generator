export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400 max-w-xl">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="line-glow mt-4" />
    </div>
  );
}
