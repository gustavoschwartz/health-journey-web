import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Purely presentational: data comes from the parent's single
 * /metrics/combined fetch (Task 29), not a per-chart fetch of its own.
 * Loading/error states are the parent's responsibility (useCombinedMetrics);
 * this only ever renders once real data is available. */
export default function MetricBarChart({ label, unit, color, data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold text-slate-900">{label}</h3>
        <span className="text-[12px] text-slate-400">{unit}</span>
      </div>

      {data && (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(d) => d.slice(5)}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(value) => [`${value} ${unit}`, label]}
            />
            {/* minPointSize gives a 0-value day a small visible sliver at the
                baseline instead of rendering as literally nothing, so a rest
                day / no-drinks day reads as "measured, zero", not a gap. Count
                metrics never return null (see Task 25), so every day always
                gets a bar; this is purely about that bar staying visible. */}
            <Bar
              dataKey="value"
              fill={color}
              radius={[2, 2, 0, 0]}
              minPointSize={2}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
