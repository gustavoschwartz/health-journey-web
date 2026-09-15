/**
 * Task 82: pure data math for the Charts screen's analysis cards. No React or
 * Recharts import, so a later test can reach it without a refactor.
 */

/** The same value as ACWR_ELEVATED_THRESHOLD in health-journey-backend's
 * app/services/training_load.py. The /analysis/training-load payload does not
 * carry the threshold, so the ACWR card's reference line needs its own copy;
 * change the two together. */
export const ACWR_ELEVATED_THRESHOLD = 1.5;

/**
 * The analysis cards' gap rule, the same rule as HealthJourneyApp's
 * analysisSegments: one row per entry, in order, holding each field's value
 * when the entry's status is "ok" and the value is a number, 0.0 included,
 * and null otherwise. A null reaches Recharts as a gap, since every analysis
 * Line sets connectNulls={false}, so an unmeasured day never draws as a rest
 * day.
 */
export function toAnalysisRows(entries, fields) {
  return entries.map((entry) => {
    const row = { date: entry.date };
    for (const field of fields) {
      const value = entry[field];
      row[field] = entry.status === "ok" && typeof value === "number" ? value : null;
    }
    return row;
  });
}
