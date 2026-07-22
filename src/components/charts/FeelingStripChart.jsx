// Matches the iPhone app's FeelingStripChart.tsx exactly (kept in sync
// manually, not shared code) so the color mapping is identical between
// clients, per this task's DoD.
const FEELING_COLORS = {
  good: "#22c55e",
  neutral: "#eab308",
  bad: "#ef4444",
};
const BLANK_COLOR = "#e5e7eb";

/** Color for a single feeling-strip cell: the mapped color for a known
 * good/neutral/bad string, or the blank color for anything else (null, a
 * missing day, or an unexpected value). A plain FEELING_COLORS[value] lookup
 * would silently return undefined (transparent) for a value outside the
 * known set, which would defeat the "visibly blank" requirement exactly
 * where it matters. */
function feelingColor(value) {
  return typeof value === "string" && value in FEELING_COLORS
    ? FEELING_COLORS[value]
    : BLANK_COLOR;
}

function evenlySpacedTickIndices(count, max) {
  if (max <= 0) return [0];
  const n = Math.min(count, max + 1);
  if (n <= 1) return [0];
  return Array.from({ length: n }, (_, i) => Math.round((i * max) / (n - 1)));
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

/** Purely presentational: data comes from the parent's single
 * /metrics/combined fetch (Task 29), not a per-chart fetch of its own.
 * Loading/error states are the parent's responsibility (useCombinedMetrics);
 * this only ever renders once real data is available. */
export default function FeelingStripChart({ label, data }) {
  const tickIndices = data
    ? new Set(evenlySpacedTickIndices(5, data.length - 1))
    : new Set();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[14px] font-semibold text-slate-900">{label}</h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <LegendDot color={FEELING_COLORS.good} label="Good" />
          <LegendDot color={FEELING_COLORS.neutral} label="Neutral" />
          <LegendDot color={FEELING_COLORS.bad} label="Bad" />
        </div>
      </div>

      {data && (
        <div>
          <div className="flex gap-[2px]">
            {data.map((point) => (
              <div
                key={point.date}
                title={`${point.date}: ${point.value ?? "no check-in"}`}
                className="h-8 flex-1 rounded-sm"
                style={{ backgroundColor: feelingColor(point.value) }}
              />
            ))}
          </div>
          <div className="mt-1 flex gap-[2px]">
            {data.map((point, i) => (
              <span
                key={point.date}
                className="flex-1 text-center text-[10px] text-slate-400"
              >
                {tickIndices.has(i) ? point.date.slice(5) : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
