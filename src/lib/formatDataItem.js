/**
 * One-line summaries for the plain (non-narrated) list Task 36 appends when
 * a client fetches a truncated range page directly from GET /data/{source}.
 * Not shown through the orchestrator, so this formatting is the only
 * presentation these records get.
 */
export function formatDataItem(source, item) {
  if (source === "strava") return formatWorkout(item);
  if (source === "apple-health") return formatAppleHealthDay(item);
  return formatManualLogDay(item);
}

function formatWorkout(w) {
  const parts = [w.type ?? "workout"];
  if (w.duration_minutes != null) parts.push(`${w.duration_minutes} min`);
  if (w.distance_km != null) parts.push(`${w.distance_km} km`);
  if (w.feeling) parts.push(`felt ${w.feeling}`);
  return `${w.date} — ${parts.join(", ")}`;
}

function formatAppleHealthDay(d) {
  const parts = [];
  if (d.steps != null) parts.push(`${d.steps} steps`);
  if (d.sleep_hours != null) parts.push(`${d.sleep_hours}h sleep`);
  if (d.hrv_ms != null) parts.push(`HRV ${d.hrv_ms}ms`);
  if (d.resting_heart_rate != null) parts.push(`RHR ${d.resting_heart_rate}`);
  if (parts.length === 0) parts.push("no data recorded");
  return `${d.date} — ${parts.join(", ")}`;
}

function formatManualLogDay(d) {
  const parts = [];
  if (d.wakeup_feeling) parts.push(`woke up ${d.wakeup_feeling}`);
  if (d.overall_feeling) parts.push(`felt ${d.overall_feeling}`);
  if (d.calories_previous_day != null) parts.push(`${d.calories_previous_day} cal`);
  if (d.alcohol?.length) {
    const drinks = d.alcohol.reduce((sum, a) => sum + a.drinks, 0);
    parts.push(`${drinks} drink${drinks === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) parts.push("no check-in");
  return `${d.date} — ${parts.join(", ")}`;
}

/** Pulls the source's own item list out of a /data/{source} response,
 * whose array key differs by source ("workouts" vs "days"). */
export function itemsFromRangeResponse(source, body) {
  return source === "strava" ? body.workouts : body.days;
}
