// Formatting helpers shared by DailyRecapCard and TodayRecapCard (Task
// 57c). Pulled out of DailyRecapCard.jsx into their own module rather than
// exported alongside its component — a component file exporting plain
// functions defeats Vite's Fast Refresh for that file (oxlint's
// react(only-export-components) warning), and there's no reason for a
// formatting helper to live in a component file in the first place.
// Mirrors HealthJourneyApp's DailyRecapCard.tsx, which exports the
// equivalent helpers directly since React Native has no Fast Refresh
// constraint forcing the same split there.

const FEELING_LABELS = { good: "Good", neutral: "Neutral", bad: "Bad" };

export function feelingLabel(value) {
  return value ? (FEELING_LABELS[value] ?? value) : "Not logged";
}

export function formatSleep(hours, deepMin, remMin, awakeMin) {
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

// Wrist temperature is stored in Celsius regardless of display preference
// (architecture.md's Apple Health Per-Day Aggregation Rules). Null is
// legitimately common even once synced — a night the watch wasn't worn to
// sleep — same ambiguous-null shape as weight, so this reuses that row's
// "No reading" wording rather than sleep/RHR/HRV's "Not synced yet".
export function formatWristTemp(value) {
  return value != null ? `${value.toFixed(1)}°C` : "No reading";
}
