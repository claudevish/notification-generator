import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function FunnelChart({ data, axisColor, gridColor, tooltipBg, tooltipBorder }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
        Lesson Completion Funnel
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fill: axisColor, fontSize: 11 }}
            width={100}
          />
          <Tooltip
            contentStyle={{
              background: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(v) => [v.toLocaleString(), "Users"]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {(data || []).map((entry, i) => (
              <Cell key={i} fill={entry.color || "#8b5cf6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
