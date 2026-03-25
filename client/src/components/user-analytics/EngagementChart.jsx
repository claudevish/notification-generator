import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function EngagementChart({ data, axisColor, gridColor, tooltipBg, tooltipBorder }) {
  return (
    <div className="glass-card rounded-xl p-5 mb-4">
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
        User Engagement Trends
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 0, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fill: axisColor, fontSize: 10 }}
            tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          />
          <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Line
            type="monotone"
            dataKey="dailyActiveUsers"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="Daily Active Users"
          />
          <Line
            type="monotone"
            dataKey="lessonsStarted"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Lessons Started"
          />
          <Line
            type="monotone"
            dataKey="lessonsCompleted"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Lessons Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
