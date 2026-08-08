import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Stacked bar-per-week chart (Task 49) — drinks by type, or a feeling mix
 * (day/wakeup) broken out good/neutral/bad. `series` is
 * [{ key, label, color }]; `data` is weekly_summary rows straight from
 * GET /summary/weekly/range's `weeks` array (not_yet_summarized weeks are
 * never included there, so they're excluded here too rather than
 * plotted as a misleading zero week). */
export default function WeeklyStackedBarChart({ label, series, data }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-[14px] font-semibold text-slate-900">{label}</h3>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="week_start_date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(d) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} width={28} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            labelFormatter={(d) => `Week of ${d}`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="stack"
              fill={s.color}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
