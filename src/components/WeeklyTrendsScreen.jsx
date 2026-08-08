import { useEffect, useState } from "react";
import WeeklyBarChart from "./charts/WeeklyBarChart";
import WeeklyStackedBarChart from "./charts/WeeklyStackedBarChart";
import { getWeeklySummaryRange } from "../lib/api";
import { addDaysISO, mostRecentCompletedWeekStartISO } from "../lib/dates";

const RANGE_OPTIONS = [
  { label: "8 weeks", value: 8 },
  { label: "13 weeks", value: 13 },
  { label: "26 weeks", value: 26 },
];

const DRINK_SERIES = [
  { key: "drinks_beer", label: "Beer", color: "#f59e0b" },
  { key: "drinks_wine", label: "Wine", color: "#9333ea" },
  { key: "drinks_hard_liquor", label: "Hard liquor", color: "#dc2626" },
];

const DAY_FEELING_SERIES = [
  { key: "days_felt_good", label: "Good", color: "#22c55e" },
  { key: "days_felt_neutral", label: "Neutral", color: "#eab308" },
  { key: "days_felt_bad", label: "Bad", color: "#ef4444" },
];

const WAKEUP_FEELING_SERIES = [
  { key: "wakeups_felt_good", label: "Good", color: "#22c55e" },
  { key: "wakeups_felt_neutral", label: "Neutral", color: "#eab308" },
  { key: "wakeups_felt_bad", label: "Bad", color: "#ef4444" },
];

export default function WeeklyTrendsScreen() {
  const [weeks, setWeeks] = useState(13);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    const toWeekStart = mostRecentCompletedWeekStartISO();
    const fromWeekStart = addDaysISO(toWeekStart, -7 * (weeks - 1));

    getWeeklySummaryRange({ fromWeekStart, toWeekStart })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [weeks]);

  // GET /summary/weekly/range's weeks array only ever contains completed
  // weeks — not_yet_summarized_weeks are already excluded there, so no
  // extra filtering is needed here to keep them off the charts.
  const workoutHoursData =
    data?.weeks.map((w) => ({ week_start_date: w.week_start_date, value: w.workout_hours })) ?? [];
  const caloriesNetData =
    data?.weeks.map((w) => ({ week_start_date: w.week_start_date, value: w.calories_net })) ?? [];

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-semibold text-slate-900">Weekly Trends</h1>
        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWeeks(opt.value)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                weeks === opt.value
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

      {!error && data && data.weeks.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-[13px] text-slate-400">
          No completed weeks in this range yet.
        </div>
      )}

      {!error && data && data.weeks.length > 0 && (
        <>
          <WeeklyBarChart label="Workout Hours" unit="hours" color="#059669" data={workoutHoursData} />
          <WeeklyBarChart
            label="Calories Net"
            unit="kcal"
            color="#0284c7"
            negativeColor="#e11d48"
            data={caloriesNetData}
          />
          <WeeklyStackedBarChart label="Drinks" series={DRINK_SERIES} data={data.weeks} />
          <WeeklyStackedBarChart label="Day Feeling Mix" series={DAY_FEELING_SERIES} data={data.weeks} />
          <WeeklyStackedBarChart label="Wakeup Feeling Mix" series={WAKEUP_FEELING_SERIES} data={data.weeks} />
        </>
      )}
    </div>
  );
}
