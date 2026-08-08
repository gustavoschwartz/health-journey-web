import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Single-series bar-per-week chart (Task 49) — workout hours or calories
 * net. When negativeColor is given, a bar below zero is colored differently
 * (e.g. calories net going the "wrong" direction) and a zero reference
 * line is drawn; data only ever contains completed weeks (the caller
 * excludes not_yet_summarized_weeks entirely, rather than plotting them as
 * a misleading zero). */
export default function WeeklyBarChart({ label, unit, color, negativeColor, data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold text-slate-900">{label}</h3>
        <span className="text-[12px] text-slate-400">{unit}</span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="week_start_date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(d) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            width={56}
            tickFormatter={(v) => v.toLocaleString()}
          />
          {negativeColor && <ReferenceLine y={0} stroke="#cbd5e1" />}
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            labelFormatter={(d) => `Week of ${d}`}
            formatter={(value) => [value == null ? "No data" : `${value} ${unit}`, label]}
          />
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {negativeColor &&
              data.map((entry) => (
                <Cell
                  key={entry.week_start_date}
                  fill={entry.value < 0 ? negativeColor : color}
                />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
