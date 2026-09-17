import { useState } from "react";
import MetricLineChart from "./charts/MetricLineChart";
import MetricBarChart from "./charts/MetricBarChart";
import FeelingStripChart from "./charts/FeelingStripChart";
import CombinedChart from "./charts/CombinedChart";
import AnalysisLineChart from "./charts/AnalysisLineChart";
import { useCombinedMetrics } from "./charts/useCombinedMetrics";
import { useAnalysisRanges } from "./charts/useAnalysisRanges";
import { ACWR_ELEVATED_THRESHOLD } from "./charts/analysisChartMath";

const RANGE_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "4 weeks", value: 28 },
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

// Task 82: the same cards, titles, units and colours as HealthJourneyApp's
// ChartsScreen.tsx and architecture.md's Phase 3 chart list. Acute and Chronic
// sit on separate cards because a 7-day total and a 28-day average are about 7
// times apart on one axis, which would read as a load spike.
const TRAINING_LOAD_CARDS = [
  { field: "acute_load_7d", label: "Acute Load", unit: "7-day total", color: "#ea580c" },
  { field: "chronic_load_28d", label: "Chronic Load", unit: "28-day average", color: "#7c3aed" },
  {
    field: "acwr",
    label: "ACWR",
    unit: "acute to chronic",
    color: "#0f766e",
    referenceY: ACWR_ELEVATED_THRESHOLD,
  },
];

// Need and actual share one card and one hours axis. Actual sleep keeps the
// indigo the Sleep card and CombinedChart use for sleep; sleep need takes a
// colour used nowhere else on this screen.
const SLEEP_NEED_SERIES = [
  { field: "sleep_need_hours", name: "Sleep need", color: "#db2777" },
  { field: "actual_sleep_hours", name: "Actual sleep", color: "#6366f1" },
];

// Task 83. The cuts readiness actually scores: a mean over the night window
// and a minimum over it, which are not the calendar-day HRV and last-sample
// resting heart rate the Phase 3 cards plot. Both read the single `value`
// field GET /analysis/overnight returns. The colours are darker shades of
// those daily lines, so an overnight card reads as their sibling.
const OVERNIGHT_CARDS = [
  {
    key: "overnightHrv",
    label: "Overnight HRV (readiness)",
    unit: "ms",
    color: "#b45309",
  },
  {
    key: "overnightRestingHr",
    label: "Overnight Lowest HR (readiness)",
    unit: "bpm",
    color: "#be123c",
  },
];

// Task 29: every chart below is fed by one shared /metrics/combined fetch
// instead of a fetch of its own, so they're all guaranteed to align to the
// same date range, and the whole screen costs exactly one network call per
// range change. CombinedChart is the single-canvas overlay of all 9 series;
// the individual cards below it stay, since they're already verified
// per-metric detail views, not a duplicate of the combined chart. Task 82's
// analysis cards are the exception: /analysis/training-load and
// /analysis/sleep-need and, since Task 83, /analysis/overnight once per
// metric are four more calls per range change, each with its own
// per-card loading and failure state, drawn inside the same gate below.
export default function ChartsScreen() {
  const [days, setDays] = useState(30);
  const { data, error } = useCombinedMetrics(days);
  const { trainingLoad, sleepNeed, overnightHrv, overnightRestingHr } =
    useAnalysisRanges(days);
  const overnight = { overnightHrv, overnightRestingHr };

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

          {TRAINING_LOAD_CARDS.map(({ field, label, unit, color, referenceY }) => (
            <AnalysisLineChart
              key={field}
              label={label}
              unit={unit}
              series={[{ field, name: label, color }]}
              entries={trainingLoad.data}
              error={trainingLoad.error}
              referenceY={referenceY}
            />
          ))}

          <AnalysisLineChart
            label="Sleep Need"
            unit="hours"
            series={SLEEP_NEED_SERIES}
            entries={sleepNeed.data}
            error={sleepNeed.error}
          />

          {OVERNIGHT_CARDS.map(({ key, label, unit, color }) => (
            <AnalysisLineChart
              key={key}
              label={label}
              unit={unit}
              series={[{ field: "value", name: label, color }]}
              entries={overnight[key].data}
              error={overnight[key].error}
            />
          ))}
        </>
      )}
    </div>
  );
}
