const SLOTS = ["Morning", "Afternoon", "Evening", "Night"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ActivityHeatmap({ data }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div className="glass-card rounded-xl p-5 mb-4">
      <h3 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-4">
        User Activity Heatmap
      </h3>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "60px repeat(4, 1fr)" }}
      >
        {/* Header row */}
        <div />
        {SLOTS.map((slot) => (
          <div
            key={slot}
            className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 text-center uppercase tracking-wider py-1"
          >
            {slot}
          </div>
        ))}

        {/* Data rows */}
        {DAYS.map((day, dayIdx) => {
          const row = data[dayIdx];
          if (!row) return null;
          return (
            <div key={day} className="contents">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center">
                {day}
              </div>
              {SLOTS.map((slot, slotIdx) => {
                const value = row[slotIdx] ?? 0;
                return (
                  <div
                    key={slot}
                    className="rounded-md h-10 cursor-pointer transition-all hover:scale-105"
                    style={{
                      backgroundColor: `rgba(139, 92, 246, ${value / 100})`,
                    }}
                    title={`${day} ${slot}: ${value}%`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
