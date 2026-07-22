import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Purely presentational: data comes from the parent's single
 * /metrics/combined fetch (Task 29), not a per-chart fetch of its own.
 * Loading/error states are the parent's responsibility (useCombinedMetrics);
 * this only ever renders once real data is available. */
export default function MetricLineChart({ label, unit, color, data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold text-slate-900">{label}</h3>
        <span className="text-[12px] text-slate-400">{unit}</span>
      </div>

      {data && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(d) => d.slice(5)}
              minTickGap={24}
            />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} width={36} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(value) => [value == null ? "No data" : `${value} ${unit}`, label]}
            />
            {/* connectNulls=false (Recharts' default too, set explicitly here since
                it's the whole point of this chart): a missing day must render as a
                visible break in the line, not an interpolated bridge or a drop to 0. */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
