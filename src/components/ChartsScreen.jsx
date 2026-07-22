import { useState } from "react";
import MetricLineChart from "./charts/MetricLineChart";
import MetricBarChart from "./charts/MetricBarChart";
import FeelingStripChart from "./charts/FeelingStripChart";
import CombinedChart from "./charts/CombinedChart";
import { useCombinedMetrics } from "./charts/useCombinedMetrics";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

const NUMERIC_CHARTS = [
  { metric: "weight", label: "Weight", unit: "kg", color: "#0d9488" },
  { metric: "sleep_hours", label: "Sleep", unit: "hours", color: "#6366f1" },
  { metric: "resting_heart_rate", label: "Resting Heart Rate", unit: "bpm", color: "#e11d48" },
  { metric: "hrv", label: "HRV", unit: "ms", color: "#d97706" },
  { metric: "calories", label: "Calories", unit: "kcal", color: "#0284c7" },
];

const COUNT_CHARTS = [
  { metric: "workout_frequency", label: "Workout Frequency", unit: "workouts", color: "#059669" },
  { metric: "alcohol_drinks", label: "Alcohol Consumption", unit: "drinks", color: "#c026d3" },
];

const FEELING_CHARTS = [
  { metric: "wakeup_feeling", label: "Wakeup Feeling" },
  { metric: "overall_feeling", label: "Overall Feeling" },
];

// Task 29: every chart below is fed by one shared /metrics/combined fetch
// instead of a fetch of its own, so they're all guaranteed to align to the
// same date range, and the whole screen costs exactly one network call per
// range change. CombinedChart is the single-canvas overlay of all 9 series;
// the individual cards below it stay, since they're already verified
// per-metric detail views, not a duplicate of the combined chart.
export default function ChartsScreen() {
  const [days, setDays] = useState(30);
  const { data, error } = useCombinedMetrics(days);

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-semibold text-slate-900">Charts</h1>
        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDays(opt.value)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                days === opt.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-[13px] text-rose-600">
          {error}
        </div>
      )}

      {!error && !data && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-[13px] text-slate-400">
          Loading…
        </div>
      )}

      {!error && data && (
        <>
          <CombinedChart combined={data} />

          {NUMERIC_CHARTS.map((chart) => (
            <MetricLineChart key={chart.metric} {...chart} data={data[chart.metric]} />
          ))}

          {COUNT_CHARTS.map((chart) => (
            <MetricBarChart key={chart.metric} {...chart} data={data[chart.metric]} />
          ))}

          {FEELING_CHARTS.map((chart) => (
            <FeelingStripChart key={chart.metric} {...chart} data={data[chart.metric]} />
          ))}
        </>
      )}
    </div>
  );
}
