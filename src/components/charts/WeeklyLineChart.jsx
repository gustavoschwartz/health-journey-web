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

/** Explicit Y-axis domain computed from the actual plotted values, rather
 * than left to recharts' own domain={["auto","auto"]} inference — mirrors
 * the RN app's weeklyYDomain (weeklyChartMath.ts), added after a sparsely-
 * logged metric (one real weight reading in an 8-week window, every other
 * week null) produced a garbled, arbitrarily-scaled axis there with the
 * real point pushed off the visible plot. A single distinct value gives
 * any auto-domain algorithm a zero-width range to infer from; padding it
 * by a fixed floor (not a percentage of zero) avoids that regardless of
 * which charting library is doing the inferring. Returns undefined when
 * there's no data at all, so the caller can fall back to "auto" cleanly. */
function weeklyYDomain(data, keys) {
  const values = [];
  for (const week of data) {
    for (const key of keys) {
      const v = week[key];
      if (typeof v === "number") values.push(v);
    }
  }
  if (values.length === 0) return undefined;

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.05, 1);
    return [min - pad, max + pad];
  }
  const pad = (max - min) * 0.1;
  return [min - pad, max + pad];
}

/** Line chart over a range of weeks — weight (one series) or blood
 * pressure (systolic/diastolic, two series). Mirrors MetricLineChart.jsx's
 * daily version, but `data` is weekly_summary rows straight from
 * GET /summary/weekly/range's `weeks` array, and `series` is
 * [{ key, label, color }] — WeeklyStackedBarChart.jsx's same shape — so one
 * component covers both the single- and multi-series cases. connectNulls
 * defaults to false: a week with no reading must show as a genuine gap,
 * not a bridge or a drop to 0. */
export default function WeeklyLineChart({ label, unit, series, data }) {
  const yDomain = weeklyYDomain(data, series.map((s) => s.key)) ?? ["auto", "auto"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-[14px] font-semibold text-slate-900">{label}</h3>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="week_start_date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(d) => d.slice(5)}
            minTickGap={24}
          />
          {/* width matches WeeklyBarChart.jsx's YAxis width (56), which
              renders full unpadded labels cleanly — this chart's previous
              width={36} + margin left:-10 combination truncated the Weight
              and Blood Pressure charts' labels (e.g. "96.0" became "9.17"
              or similar), since 36px isn't enough for a decimal value plus
              the negative left margin pushed the axis further left still. */}
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={yDomain} width={56} />
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
