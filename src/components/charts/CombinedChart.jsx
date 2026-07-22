import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildCombinedChartData } from "./combinedChartMath";

// The genuine single-canvas Combined View (Task 29 rework): all 9 metrics
// layered on one shared y-axis via combinedChartMath's row-bands, instead of
// 9 separate cards. Numeric trends and the two count metrics sit on top;
// wakeup/overall feeling sit at the very bottom, deliberately, so they read
// as the outcome of everything above rather than a tenth parallel series.

const NUMERIC_SERIES = [
  { key: "weight", label: "Weight", unit: "kg", color: "#0d9488" },
  { key: "sleep_hours", label: "Sleep", unit: "hours", color: "#6366f1" },
  { key: "resting_heart_rate", label: "Resting HR", unit: "bpm", color: "#e11d48" },
  { key: "hrv", label: "HRV", unit: "ms", color: "#d97706" },
  { key: "calories", label: "Calories", unit: "kcal", color: "#0284c7" },
];

const COUNT_SERIES = [
  { key: "workout_frequency", label: "Workouts", unit: "workouts", color: "#059669" },
  { key: "alcohol_drinks", label: "Alcohol", unit: "drinks", color: "#c026d3" },
];

const FEELING_SERIES = [
  { key: "wakeup_feeling", label: "Wakeup Feeling" },
  { key: "overall_feeling", label: "Overall Feeling" },
];

function formatRaw(value, unit) {
  if (value === null || value === undefined) return "No data";
  if (typeof value === "string") return value.charAt(0).toUpperCase() + value.slice(1);
  return unit ? `${value} ${unit}` : `${value}`;
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function CombinedTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-[12px] shadow-sm">
      <div className="mb-2 font-semibold text-slate-900">{row.date}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {NUMERIC_SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-slate-500">{s.label}:</span>
            <span className="font-medium text-slate-900">
              {formatRaw(row[`${s.key}_raw`], s.unit)}
            </span>
          </div>
        ))}
        {COUNT_SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-slate-500">{s.label}:</span>
            <span className="font-medium text-slate-900">
              {formatRaw(row[`${s.key}_raw`], s.unit)}
            </span>
          </div>
        ))}
        {FEELING_SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: row[`${s.key}_color`] }}
            />
            <span className="text-slate-500">{s.label}:</span>
            <span className="font-medium text-slate-900">{formatRaw(row[`${s.key}_raw`])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Purely presentational: data comes from the parent's single
 * /metrics/combined fetch, not a per-chart fetch of its own. */
export default function CombinedChart({ combined }) {
  const data = buildCombinedChartData(combined);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold text-slate-900">Combined View</h3>
      </div>
      <p className="mb-2 text-[11px] text-slate-400">Hover the chart to inspect a day</p>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(d) => d.slice(5)}
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} hide />
          <Tooltip content={<CombinedTooltip />} />

          {/* Every count/feeling series shares one stackId purely so Recharts
              renders them at full category width stacked at the same x
              position instead of narrowing and offsetting them side by side,
              which is its default for multiple sibling Bar series. Each
              series' dataKey is already a resolved [y0, y] range, so nothing
              here actually gets summed. */}
          {COUNT_SERIES.map((s) => (
            <Bar
              key={s.key}
              dataKey={`${s.key}_range`}
              stackId="combined-bands"
              fill={s.color}
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          ))}

          {FEELING_SERIES.map((s) => (
            <Bar
              key={s.key}
              dataKey={`${s.key}_range`}
              stackId="combined-bands"
              isAnimationActive={false}>
              {data.map((row, i) => (
                <Cell key={i} fill={row[`${s.key}_color`]} />
              ))}
            </Bar>
          ))}

          {NUMERIC_SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={`${s.key}_y`}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
        {NUMERIC_SERIES.map((s) => (
          <LegendDot key={s.key} color={s.color} label={s.label} />
        ))}
        {COUNT_SERIES.map((s) => (
          <LegendDot key={s.key} color={s.color} label={s.label} />
        ))}
        <LegendDot color="#22c55e" label="Feeling: good" />
        <LegendDot color="#eab308" label="Feeling: neutral" />
        <LegendDot color="#ef4444" label="Feeling: bad" />
      </div>
    </div>
  );
}
