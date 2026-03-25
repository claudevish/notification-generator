export default function CohortTable({ data }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  function retentionColor(rate) {
    const val = parseFloat(rate);
    if (val > 70) return "text-emerald-400";
    if (val >= 40) return "text-amber-400";
    return "text-red-400";
  }

  return (
    <div className="glass-card rounded-xl p-5 mb-4">
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Cohort Retention
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-500/10 text-zinc-500 text-xs uppercase tracking-wider">
              <th className="text-left py-2 pr-4 font-medium">Day</th>
              <th className="text-right py-2 pr-4 font-medium">Users</th>
              <th className="text-right py-2 pr-4 font-medium">Lessons Started</th>
              <th className="text-right py-2 pr-4 font-medium">Lessons Completed</th>
              <th className="text-right py-2 pr-4 font-medium">Avg Engagement</th>
              <th className="text-right py-2 pr-4 font-medium">Retention Rate</th>
              <th className="text-right py-2 font-medium">Notif Response</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-brand-500/5 hover:bg-brand-600/5 transition-colors"
              >
                <td className="py-2.5 pr-4 text-zinc-700 dark:text-zinc-300 font-medium">
                  Day {idx}
                </td>
                <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {(row.users || 0).toLocaleString()}
                </td>
                <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {(row.lessonsStarted || 0).toLocaleString()}
                </td>
                <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {(row.lessonsCompleted || 0).toLocaleString()}
                </td>
                <td className="py-2.5 pr-4 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {row.avgEngagement}%
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span className={`text-xs font-semibold ${retentionColor(row.retentionRate)}`}>
                    {row.retentionRate}%
                  </span>
                </td>
                <td className="py-2.5 text-right text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {row.notifResponse}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
