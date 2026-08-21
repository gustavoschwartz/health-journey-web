// TodayRecapCard (Task 57c) — the "today" half of CheckinScreen's two-block
// completion recap: this morning's freshly-answered wakeup_feeling plus
// last night's overnight vitals, best-effort only. Deliberately much
// narrower than DailyRecapCard — no overall_feeling, calories, workouts,
// alcohol, Mounjaro, notes, steps, weight, or blood pressure, since none of
// those are meaningful yet this early in the day. Mirrors
// HealthJourneyApp's TodayRecapCard.tsx field for field, reusing
// DailyRecapCard's Row/formatting helpers rather than redefining them so
// both blocks read identically for the fields they share.

import { Row } from "./DailyRecapCard";
import { feelingLabel, formatSleep, formatWristTemp } from "../lib/recapFormat";

export default function TodayRecapCard({ recap }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 p-5 text-left">
      <Row label="Woke up feeling" value={feelingLabel(recap.wakeup_feeling)} />

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
      {!recap.apple_health_synced && (
        <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
          Last night&rsquo;s Apple Health data hasn&rsquo;t synced yet.
        </p>
      )}
    </div>
  );
}
