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
//
// Named apart from the card's `formatSubtracted` on purpose: this one returns
// "No data" through formatSigned, the card's returns "—" through formatKcal,
// and one name for two behaviours is how a later reader "unifies" them and
// puts the wrong placeholder on one of the two screens. The thing worth being
// single is the rule — negate after the null check — not the function.
function formatSubtractedSigned(n, unit = "") {
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

  // Task 50j: the NEAT caveat qualifies the net, so it fires only when there
  // is a net to qualify — and then on NEAT being absent or partial. A week
  // with no logged intake has `days_with_neat_data: 0`, which is "fewer than
  // 7", and must still stay quiet: with no net on screen the caveat would
  // point at a figure that is not there. Coverage is the second condition,
  // never the first.
  const neatNeverSynced =
    data?.calories_net != null && data.neat_kcal_total == null;
  const neatPartiallySynced =
    data?.calories_net != null &&
    data.neat_kcal_total != null &&
    (data.days_with_neat_data ?? 0) < WEEK_LENGTH_DAYS;

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
            <StatRow label="TEF" value={formatSubtractedSigned(data.tef_kcal_total, " kcal")} />
            <StatRow label="BMR" value={formatSubtractedSigned(data.bmr_kcal_total, " kcal")} />
            <StatRow label="NEAT" value={formatSubtractedSigned(data.neat_kcal_total, " kcal")} />
            <StatRow
              label="Workout calories"
              value={formatSubtractedSigned(data.workout_calories, " kcal")}
            />
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
            {/* Task 50j: the net sits below a divider with the day counts
                above it, the way DailyRecapCard sets its own net off. As
                shipped it was mid-block, so the bottom line was not at the
                bottom and BMR — the largest figure — was where the eye
                landed. */}
            <div className="my-1.5 border-t border-slate-200" />
            <StatRow label="Net" value={formatSigned(data.calories_net, " kcal")} />
            {neatNeverSynced && (
              <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-700">
                Active energy data has not synced for this week — non-exercise activity (NEAT)
                is not in the net above.
              </p>
            )}
            {neatPartiallySynced && (
              <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-700">
                Active energy covers part of this week — non-exercise activity (NEAT) for the
                remaining days is not in the net above.
              </p>
            )}
            {/* Mirrors DailyRecapCard's footnote. The row labels stay bare
                `TEF` / `NEAT` / `BMR`, matching the iPhone app row for row. */}
            <p className="mt-1.5 text-[11px] text-slate-400">
              TEF: thermic effect of food. NEAT: non-exercise activity thermogenesis.
            </p>
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
