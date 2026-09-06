import { useEffect, useState } from "react";
import { getWeeklySummary } from "../lib/api";
import { addDaysISO, mostRecentCompletedWeekStartISO } from "../lib/dates";

// Task 50j: the denominator of `days_with_neat_data / 7`, and the threshold
// below which the NEAT coverage caveat shows.
const WEEK_LENGTH_DAYS = 7;

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-900">{value}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="mb-1.5 text-[13px] font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

/** null/undefined -> "No data"; otherwise a +/- sign in front of the
 * rounded number, so a calorie or weight delta reads as a direction at a
 * glance rather than requiring the reader to notice a bare minus sign. */
function formatSigned(n, unit = "") {
  if (n == null) return "No data";
  const rounded = Math.round(n * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}${unit}`;
}

// Task 50j: the four terms the weekly net subtracts read as negatives, the
// same way they do on DailyRecapCard. Negate after the null check, never
// before — `-null` is `-0`, and formatSigned renders that as "0 kcal", a
// measured zero where the honest answer is "not computed for this week".
function formatSubtracted(n, unit = "") {
  return n == null ? "No data" : formatSigned(-n, unit);
}

export default function WeeklySummaryScreen() {
  const [weekStart, setWeekStart] = useState(mostRecentCompletedWeekStartISO());
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    getWeeklySummary({ weekStart })
      .then((body) => {
        if (!cancelled) setData(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  const inProgress = data?.status === "not_yet_completed";

  return (
    <div className="flex flex-col gap-4 overflow-y-auto pb-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDaysISO(w, -7))}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          ← Prior week
        </button>
        <h1 className="text-center text-[15px] font-semibold text-slate-900">
          Week of {weekStart}
          {data?.week_end_date ? ` – ${data.week_end_date}` : ""}
        </h1>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addDaysISO(w, 7))}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Next week →
        </button>
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

      {!error && data && inProgress && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-[13px] text-slate-400">
          This week isn&rsquo;t complete yet — check back after Sunday.
        </div>
      )}

      {!error && data && !inProgress && (
        <>
          <Card title="🏋️ Workouts">
            <StatRow label="Count" value={data.workout_count} />
            <StatRow label="Hours" value={data.workout_hours} />
            <StatRow
              label="Strong / Normal / Weak / Unrated"
              value={`${data.workout_feeling_strong_count} / ${data.workout_feeling_normal_count} / ${data.workout_feeling_weak_count} / ${data.workout_feeling_unrated_count}`}
            />
          </Card>

          {/* Task 50j: the same five terms the daily recap card shows, using
              bmr_kcal_total rather than the per-day bmr_kcal_used, so the
              rows explain the net beneath them instead of contradicting it
              by six days of BMR. "Calories burned" moved here from the
              Workouts card above — it is the workout term, and showing it in
              both places would be one figure twice under two labels. */}
          <Card title="🍽️ Calories">
            <StatRow
              label="Ingested total"
              value={formatSigned(data.calories_ingested_total, " kcal")}
            />
            <StatRow label="TEF" value={formatSubtracted(data.tef_kcal_total, " kcal")} />
            <StatRow label="BMR" value={formatSubtracted(data.bmr_kcal_total, " kcal")} />
            <StatRow label="NEAT" value={formatSubtracted(data.neat_kcal_total, " kcal")} />
            <StatRow
              label="Workout calories"
              value={formatSubtracted(data.workout_calories, " kcal")}
            />
            <StatRow label="Net" value={formatSigned(data.calories_net, " kcal")} />
            <StatRow
              label="Days logged"
              value={`${data.days_with_calorie_data} / ${WEEK_LENGTH_DAYS}`}
            />
            <StatRow
              label="Days with NEAT data"
              value={
                data.days_with_neat_data == null
                  ? "No data"
                  : `${data.days_with_neat_data} / ${WEEK_LENGTH_DAYS}`
              }
            />
            {(data.days_with_neat_data ?? 0) < WEEK_LENGTH_DAYS && (
              <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-700">
                Active energy data may not have synced yet — the weekly net could still be
                missing NEAT.
              </p>
            )}
          </Card>

          <Card title="⚖️ Weight">
            {data.weight_start_kg == null ? (
              <p className="text-[13px] text-slate-400">No weight readings this week.</p>
            ) : (
              <>
                <StatRow label="Start" value={`${data.weight_start_kg} kg`} />
                <StatRow label="End" value={`${data.weight_end_kg} kg`} />
                <StatRow label="Change" value={formatSigned(data.weight_delta_kg, " kg")} />
              </>
            )}
            <div className="mt-3 flex gap-1">
              {data.daily_weights.map((d) => (
                <div key={d.date} className="flex-1 text-center">
                  <div className="text-[10px] text-slate-400">{d.date.slice(5)}</div>
                  <div className="text-[12px] font-medium text-slate-700">
                    {d.weight_kg ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="🩺 Vitals">
            <StatRow
              label="Steps (total)"
              value={data.steps_total != null ? data.steps_total.toLocaleString() : "No data"}
            />
            <StatRow
              label="Sleep (avg)"
              value={data.sleep_hours_avg != null ? `${data.sleep_hours_avg} hrs` : "No data"}
            />
            <StatRow
              label="Resting heart rate (avg)"
              value={data.resting_heart_rate_avg != null ? `${data.resting_heart_rate_avg} bpm` : "No data"}
            />
            <StatRow
              label="HRV (avg)"
              value={data.hrv_ms_avg != null ? `${data.hrv_ms_avg} ms` : "No data"}
            />
            <StatRow
              label="Days synced"
              value={`${data.days_with_apple_health_data ?? 0} / ${WEEK_LENGTH_DAYS}`}
            />
            <StatRow
              label="Blood pressure (avg)"
              value={
                data.bp_reading_count
                  ? `${data.bp_systolic_avg}/${data.bp_diastolic_avg}, pulse ${data.bp_pulse_avg} (${data.bp_reading_count} reading${data.bp_reading_count === 1 ? "" : "s"})`
                  : "No readings this week"
              }
            />
          </Card>

          <Card title="🍷 Drinks">
            <StatRow label="Beer" value={data.drinks_beer} />
            <StatRow label="Wine" value={data.drinks_wine} />
            <StatRow label="Hard liquor" value={data.drinks_hard_liquor} />
          </Card>

          <Card title="🙂 Feelings">
            <StatRow
              label="Day felt good / neutral / bad"
              value={`${data.days_felt_good} / ${data.days_felt_neutral} / ${data.days_felt_bad}`}
            />
            <StatRow
              label="Wakeups good / neutral / bad"
              value={`${data.wakeups_felt_good} / ${data.wakeups_felt_neutral} / ${data.wakeups_felt_bad}`}
            />
          </Card>

          <Card title="💉 Mounjaro">
            {data.mounjaro_dose_mg != null ? (
              <StatRow label={data.mounjaro_dose_date} value={`${data.mounjaro_dose_mg} mg`} />
            ) : (
              <p className="text-[13px] text-slate-400">No dose logged this week.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
