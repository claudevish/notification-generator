import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function NotificationImpactChart({ data, axisColor, gridColor, tooltipBg, tooltipBorder }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Notification Impact on Learning
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 0, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="date"
            tick={{ fill: axisColor, fontSize: 10 }}
            tickFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          />
          <YAxis yAxisId="left" tick={{ fill: axisColor, fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: axisColor, fontSize: 11 }} />
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
            yAxisId="left"
            type="monotone"
            dataKey="notificationsSent"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Notifications Sent"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="lessonsStarted"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="Lessons Started"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="lessonsCompleted"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Lessons Completed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
