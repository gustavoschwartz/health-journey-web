import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Line chart over a range of weeks — weight (one series) or blood
 * pressure (systolic/diastolic, two series). Mirrors MetricLineChart.jsx's
 * daily version, but `data` is weekly_summary rows straight from
 * GET /summary/weekly/range's `weeks` array, and `series` is
 * [{ key, label, color }] — WeeklyStackedBarChart.jsx's same shape — so one
 * component covers both the single- and multi-series cases. connectNulls
 * defaults to false: a week with no reading must show as a genuine gap,
 * not a bridge or a drop to 0. */
export default function WeeklyLineChart({ label, unit, series, data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-[14px] font-semibold text-slate-900">{label}</h3>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="week_start_date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(d) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={["auto", "auto"]} width={36} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            labelFormatter={(d) => `Week of ${d}`}
            formatter={(value, name) => [value == null ? "No data" : `${value} ${unit}`, name]}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
