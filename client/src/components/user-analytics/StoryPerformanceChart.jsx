import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export default function StoryPerformanceChart({ data, axisColor, gridColor, tooltipBg, tooltipBorder }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Story Performance
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="storyName"
            tick={{ fill: axisColor, fontSize: 10 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
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
          <Bar
            dataKey="completion"
            name="Completion"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="engagement"
            name="Engagement"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="time"
            name="Time"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
