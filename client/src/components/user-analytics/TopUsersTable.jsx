export default function TopUsersTable({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  function rankBadge(rank) {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-400/20 text-zinc-400 text-xs font-bold">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 text-xs font-bold">
          3
        </span>
      );
    }
    return (
      <span className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums pl-1.5">
        {rank}
      </span>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Top Users
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-500/10 text-zinc-500 text-xs uppercase tracking-wider">
              <th className="text-left py-2 pr-3 font-medium">Rank</th>
              <th className="text-left py-2 pr-3 font-medium">Username</th>
              <th className="text-left py-2 pr-3 font-medium">Story</th>
              <th className="text-right py-2 pr-3 font-medium">Day</th>
              <th className="text-right py-2 pr-3 font-medium">Lessons</th>
              <th className="text-right py-2 pr-3 font-medium">Time Spent</th>
              <th className="text-right py-2 font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user, idx) => (
              <tr
                key={user.username || idx}
                className="border-b border-brand-500/5 hover:bg-brand-600/5 transition-colors"
              >
                <td className="py-2.5 pr-3">{rankBadge(idx + 1)}</td>
                <td className="py-2.5 pr-3 text-zinc-800 dark:text-zinc-200 font-medium">
                  {user.username}
                </td>
                <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
                  {user.story}
                </td>
                <td className="py-2.5 pr-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {user.day}
                </td>
                <td className="py-2.5 pr-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {user.lessons}
                </td>
                <td className="py-2.5 pr-3 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {user.timeSpent}
                </td>
                <td className="py-2.5 text-right text-zinc-500 dark:text-zinc-400 text-xs">
                  {user.lastActive}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
