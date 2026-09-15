import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toAnalysisRows } from "./analysisChartMath";

/** Task 82: one analysis card on the Charts screen. Unlike MetricLineChart,
 * its data comes from an /analysis range fetch of its own rather than the
 * shared /metrics/combined one, so it draws its own "Loading…" and
 * "Couldn't load." states. Every plotted value, and every value its tooltip
 * shows, is a payload field as returned. */
export default function AnalysisLineChart({ label, unit, series, entries, error, referenceY }) {
  let body;
  if (error) {
    body = <CardMessage>Couldn't load.</CardMessage>;
  } else if (entries === null) {
    body = <CardMessage>Loading…</CardMessage>;
  } else {
    const rows = toAnalysisRows(
      entries,
      series.map((s) => s.field),
    );
    body = (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={rows} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
            formatter={(value, name) => [value == null ? "No data" : value, name]}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {/* Unlabelled, and extendDomain so the line stays in view on a range
              where every value sits below it. */}
          {referenceY !== undefined && (
            <ReferenceLine
              y={referenceY}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
          )}
          {series.map((s) => (
            <Line
              key={s.field}
              type="monotone"
              dataKey={s.field}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold text-slate-900">{label}</h3>
        <span className="text-[12px] text-slate-400">{unit}</span>
      </div>
      {body}
    </div>
  );
}

function CardMessage({ children }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-[13px] text-slate-400">
      {children}
    </div>
  );
}
