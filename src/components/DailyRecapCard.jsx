// DailyRecapCard: the row/divider content shared by CheckinScreen's
// Check-In Complete state (Task 53) and the inline chat card
// get_day_recap's result renders as (Phase 7). Mirrors HealthJourneyApp's
// DailyRecapCard.tsx field for field, so both clients show the same data
// the same way — pulled into its own file for the same reason that one
// was: so the two call sites stay visually identical instead of drifting
// apart the next time one gets tweaked.

import { feelingLabel, formatSleep, formatWristTemp } from "../lib/recapFormat";

function formatKcal(value) {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  // `|| 0` normalizes negative zero: `(-0).toLocaleString()` is the string
  // "-0", so a zero term negated by formatSubtracted below would render
  // "-0 kcal" — which reads as a signed measurement rather than as nothing.
  const rounded = Math.round(value) || 0;
  return `${sign}${rounded.toLocaleString()} kcal`;
}

// Task 50j: the four terms the net subtracts read as negatives, so the block
// is legible as the arithmetic it is rather than five unrelated figures.
// Negate *after* the null check, never before — `-null` is `-0`, which
// formatKcal renders as "0 kcal": a measured claim that the term was zero
// instead of an admission it is missing, which is exactly the claim
// neat_included exists to avoid making.
function formatSubtracted(value) {
  return value == null ? "—" : formatKcal(-value);
}

// Strava's sport_type comes back camelCase ("WeightTraining"), unspaced —
// found live: Claude's own prose humanizes it to "Weight Training", but
// this card was showing the raw value until this fix.
function humanizeWorkoutType(type) {
  return type.replace(/([a-z])([A-Z])/g, "$1 $2");
}

// Exported for TodayRecapCard (Task 57c) — same row look, both blocks of
// the check-in-completion recap.
// `emphasis` (Task 50j): the net is the row the block exists to explain, so it
// reads heavier than the five terms above it rather than identical to them.
export function Row({ label, value, emphasis = false }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[14px]">
      <span className={emphasis ? "font-semibold text-slate-900" : "text-slate-500"}>{label}</span>
      <span className={emphasis ? "text-[16px] font-bold text-slate-900" : "font-medium text-slate-800"}>
        {value}
      </span>
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
      <Row label="Wrist temperature" value={formatWristTemp(recap.wrist_temperature_c)} />
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
      {/* Task 50j: the five terms that produce the net, with the net below a
          divider. Every figure is one the API returned — nothing here
          combines two fields to make a third, which is what would make the
          block a second, disagreeing implementation of the formula. */}
      <Row label="Calories consumed" value={formatKcal(recap.calories_previous_day)} />
      <Row label="TEF" value={formatSubtracted(recap.tef_kcal)} />
      <Row label="BMR" value={formatSubtracted(recap.basal_metabolism_kcal)} />
      {/* Beside the row it describes, not under the net four rows below: the
          copy says "this figure", and down there the nearest figure was the
          net, so it read as "the net is a placeholder". Ungated on purpose —
          it qualifies this row, which shows a real number even on a
          nothing-logged card. */}
      {recap.bmr_source === "default" && (
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
          Your basal metabolic rate has not been set — this figure is the app&apos;s placeholder.
        </p>
      )}
      <Row label="NEAT" value={formatSubtracted(recap.neat_kcal)} />
      <Row
        label="Workout calories"
        value={
          formatSubtracted(recap.workout_calories) +
          (recap.workout_count > 0
            ? ` (${recap.workout_count} workout${recap.workout_count === 1 ? "" : "s"})`
            : "")
        }
      />

      <div className="my-2 border-t border-slate-100" />

      <Row label="Net calories" value={formatKcal(recap.calories_net)} emphasis />
      {/* Gated on the net existing, not on neat_included alone (Task 50j).
          A null net leaves this caveat nothing to qualify: an amber warning
          about a figure that is not on screen. The BMR caveat below is
          deliberately NOT gated — it qualifies the BMR row's provenance, and
          that row shows a real figure even on a nothing-logged card. */}
      {!recap.neat_included && recap.calories_net != null && (
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
          Active energy data may not have synced yet — net calories above could still be missing
          non-exercise activity (NEAT).
        </p>
      )}
      {/* Gated for the same reason as the NEAT caveat above: this text names
          "net calories above" too, so with a null net it warns about a figure
          that is not on screen. Copy untouched — only the condition. */}
      {!recap.workout_data_synced && recap.calories_net != null && (
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
          Workout data may not have synced yet — net calories above could still be missing a workout.
        </p>
      )}
      {/* Darker than the footnote beneath it: this line is the only thing
          saying why the calorie rows read an em dash. */}
      {recap.calories_net == null && (
        <p className="mt-1.5 text-[14px] text-slate-600">
          No food logged, so there is no net to compute.
        </p>
      )}
      {/* Task 50j: TEF and NEAT are the two least familiar labels in the
          block, and neither was ever spelled out. Expanded here rather than in
          the row labels — the labels stay bare because the iPhone tests match
          them by exact equality, and this file mirrors that one row for row. */}
      <p className="mt-1 text-[13px] text-slate-500">
        TEF: thermic effect of food. NEAT: non-exercise activity thermogenesis.
      </p>

      <div className="my-2 border-t border-slate-100" />

      <Row label="Drinks" value={hasDrinks ? drinkParts.join(", ") : "None"} />
      {recap.mounjaro_dose_mg != null && (
        <Row label="Mounjaro" value={`${recap.mounjaro_dose_mg}mg`} />
      )}
    </div>
  );
}
