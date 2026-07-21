import { useState } from "react";
import MetricLineChart from "./charts/MetricLineChart";
import MetricBarChart from "./charts/MetricBarChart";

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

export default function ChartsScreen() {
  const [days, setDays] = useState(30);

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

      {NUMERIC_CHARTS.map((chart) => (
        <MetricLineChart key={chart.metric} days={days} {...chart} />
      ))}

      {COUNT_CHARTS.map((chart) => (
        <MetricBarChart key={chart.metric} days={days} {...chart} />
      ))}
    </div>
  );
}
