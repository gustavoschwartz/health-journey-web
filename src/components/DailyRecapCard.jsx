// DailyRecapCard: the row/divider content shared by CheckinScreen's
// Check-In Complete state (Task 53) and the inline chat card
// get_day_recap's result renders as (Phase 7). Mirrors HealthJourneyApp's
// DailyRecapCard.tsx field for field, so both clients show the same data
// the same way — pulled into its own file for the same reason that one
// was: so the two call sites stay visually identical instead of drifting
// apart the next time one gets tweaked.

const FEELING_LABELS = { good: "Good", neutral: "Neutral", bad: "Bad" };

function feelingLabel(value) {
  return value ? (FEELING_LABELS[value] ?? value) : "Not logged";
}

function formatKcal(value) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value).toLocaleString()} kcal`;
}

function formatSleep(hours, deepMin, remMin, awakeMin) {
  if (hours == null) return "Not synced yet";
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  const parts = [
    deepMin != null && `${deepMin} min deep`,
    remMin != null && `${remMin} min REM`,
    awakeMin != null && `${awakeMin} min awake`,
  ].filter(Boolean);
  const detail = parts.length > 0 ? ` (${parts.join(", ")})` : "";
  return `${wholeHours}h ${minutes}min${detail}`;
}

// Strava's sport_type comes back camelCase ("WeightTraining"), unspaced —
// found live: Claude's own prose humanizes it to "Weight Training", but
// this card was showing the raw value until this fix.
function humanizeWorkoutType(type) {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[14px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

export default function DailyRecapCard({ recap }) {
  const hasDrinks = recap.drinks_beer > 0 || recap.drinks_wine > 0 || recap.drinks_hard_liquor > 0;
  const drinkParts = [
    recap.drinks_beer > 0 && `${recap.drinks_beer} beer`,
    recap.drinks_wine > 0 && `${recap.drinks_wine} wine`,
    recap.drinks_hard_liquor > 0 && `${recap.drinks_hard_liquor} hard liquor`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 p-5 text-left">
      <Row label="Woke up feeling" value={feelingLabel(recap.wakeup_feeling)} />
      <Row label="Overall feeling" value={feelingLabel(recap.overall_feeling)} />

      {recap.notes != null && (
        <div className="py-1.5">
          <span className="text-[14px] text-slate-500">Note</span>
          <p className="mt-1 text-[14px] italic text-slate-700">&ldquo;{recap.notes}&rdquo;</p>
        </div>
      )}

      <div className="my-2 border-t border-slate-100" />

      <Row
        label="Sleep"
        value={formatSleep(
          recap.sleep_hours,
          recap.sleep_deep_minutes,
          recap.sleep_rem_minutes,
          recap.sleep_awake_minutes,
        )}
      />
      <Row
        label="Resting heart rate"
        value={recap.resting_heart_rate != null ? `${recap.resting_heart_rate} bpm` : "Not synced yet"}
      />
      <Row
        label="HRV"
        value={recap.hrv_ms != null ? `${Math.round(recap.hrv_ms)} ms` : "Not synced yet"}
      />
      <Row label="Steps" value={recap.steps != null ? recap.steps.toLocaleString() : "Not synced yet"} />
      <Row label="Weight" value={recap.weight_kg != null ? `${recap.weight_kg} kg` : "No reading"} />
      {(recap.bp_readings ?? []).map((b, i) => (
        <Row
          key={i}
          label={b.time_of_day ? `Blood pressure (${b.time_of_day})` : "Blood pressure"}
          value={`${b.systolic}/${b.diastolic}, pulse ${b.pulse}`}
        />
      ))}
      {!recap.apple_health_synced && (
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
          Apple Health data may not have synced yet for this day.
        </p>
      )}

      <div className="my-2 border-t border-slate-100" />

      <Row
        label="Calories consumed"
        value={recap.calories_previous_day != null ? recap.calories_previous_day.toLocaleString() : "Not logged"}
      />
      {(recap.workouts ?? []).map((w, i) => (
        <Row
          key={i}
          label={humanizeWorkoutType(w.type)}
          value={
            `${w.duration_minutes} min, ${w.calories != null ? w.calories.toLocaleString() : "—"} kcal` +
            (w.feeling ? ` — felt ${feelingLabel(w.feeling)}` : "")
          }
        />
      ))}
      <Row
        label="Workout calories"
        value={
          recap.workout_count > 0
            ? `${recap.workout_calories.toLocaleString()} (${recap.workout_count} workout${recap.workout_count === 1 ? "" : "s"})`
            : "No workouts"
        }
      />
      <Row label="Net calories" value={formatKcal(recap.calories_net)} />
      {!recap.workout_data_synced && (
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
          Workout data may not have synced yet — net calories above could still be missing a workout.
        </p>
      )}

      <div className="my-2 border-t border-slate-100" />

      <Row label="Drinks" value={hasDrinks ? drinkParts.join(", ") : "None"} />
      {recap.mounjaro_dose_mg != null && (
        <Row label="Mounjaro" value={`${recap.mounjaro_dose_mg}mg`} />
      )}
    </div>
  );
}
