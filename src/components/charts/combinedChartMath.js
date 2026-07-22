// Pure math for the true single-canvas Combined View: every one of the 9
// /metrics/combined series shares ONE y-axis (0-100, an abstract index, not
// a real unit), each occupying its own vertical row-band within it. This is
// what makes a real overlay possible across wildly different units (kg vs
// bpm vs ms vs kcal vs a count vs a categorical feeling) without juggling
// multiple y-axes. Mirrors the iPhone app's combinedChartMath.ts (kept in
// sync manually, not shared code, same as this repo's feelingColor).
//
// Row order (top to bottom) is deliberate: the 5 numeric trends and the 2
// count metrics sit above the 2 feeling bands, so the feelings read as the
// outcome of everything above them, not just another parallel series.

export const ROW_BANDS = {
  numeric: { low: 46, high: 100 },
  workoutFrequency: { low: 36, high: 44 },
  alcoholDrinks: { low: 26, high: 34 },
  wakeupFeeling: { low: 12, high: 22 },
  overallFeeling: { low: 0, high: 10 },
};

const FEELING_COLORS = {
  good: "#22c55e",
  neutral: "#eab308",
  bad: "#ef4444",
};
const FEELING_BLANK_COLOR = "#e5e7eb";

/** Color for a single feeling value: the mapped color for a known
 * good/neutral/bad string, or the blank color for anything else (null, a
 * missing day, or an unexpected value). A plain FEELING_COLORS[value] lookup
 * would silently return undefined (transparent) for a value outside the
 * known set, which would defeat the "visibly blank" requirement. */
export function feelingColor(value) {
  return typeof value === "string" && value in FEELING_COLORS
    ? FEELING_COLORS[value]
    : FEELING_BLANK_COLOR;
}

/** Maps a raw value into [band.low, band.high] using the series' own
 * min/max in the current range. A series with no variance (min === max,
 * including a single data point) maps every value to the band's midpoint
 * rather than dividing by zero. */
export function normalizeValue(raw, min, max, band) {
  if (min === max) return (band.low + band.high) / 2;
  const t = (raw - min) / (max - min);
  return band.low + t * (band.high - band.low);
}

function numericMinMax(data) {
  const values = data.map((d) => d.value).filter((v) => typeof v === "number");
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

function buildNumericField(data, band) {
  const range = numericMinMax(data);
  return data.map((point) => {
    if (typeof point.value !== "number" || !range) return { y: null, raw: null };
    return { y: normalizeValue(point.value, range.min, range.max, band), raw: point.value };
  });
}

// Count metrics (workout_frequency, alcohol_drinks) never return null (Task
// 25), so every day gets a floating bar from band.low to a height
// proportional to that day's share of the max value seen in range. A true
// zero still gets a small visible top above band.low, same "stay visible"
// reasoning as MetricBarChart's minPointSize, just scaled into this band.
function buildRangeField(data, band) {
  const numericValues = data.map((d) => (typeof d.value === "number" ? d.value : 0));
  const dataMax = Math.max(...numericValues, 0);
  const bandHeight = band.high - band.low;
  const minVisibleTop = band.low + bandHeight * 0.15;
  return data.map((point) => {
    const raw = typeof point.value === "number" ? point.value : 0;
    const top = dataMax > 0 && raw > 0 ? band.low + (raw / dataMax) * bandHeight : minVisibleTop;
    return { y: top, y0: band.low, raw };
  });
}

// Feeling bands are always full-band height; presence is conveyed by color
// (feelingColor), not by height, so every day gets an identically-sized
// floating bar and only its fill color changes.
function buildFeelingField(data, band) {
  return data.map((point) => ({
    y: band.high,
    y0: band.low,
    color: feelingColor(point.value),
    raw: typeof point.value === "string" ? point.value : null,
  }));
}

/**
 * Assembles the /metrics/combined response into one row per date, each
 * carrying every series' plotting position on the shared 0-100 axis
 * alongside its true raw value for tooltip display, plus a `range` tuple
 * for the count/feeling series so Recharts can render them as floating bars
 * (a Bar's dataKey may be a [min, max] pair). All 9 series come back from
 * the backend with identical date arrays (Task 25 fills every date for
 * every metric), so any one metric's dates are used as the canonical list.
 */
export function buildCombinedChartData(combined) {
  const dates = (combined.weight ?? combined.sleep_hours ?? []).map((d) => d.date);

  const weight = buildNumericField(combined.weight ?? [], ROW_BANDS.numeric);
  const sleepHours = buildNumericField(combined.sleep_hours ?? [], ROW_BANDS.numeric);
  const restingHeartRate = buildNumericField(
    combined.resting_heart_rate ?? [],
    ROW_BANDS.numeric,
  );
  const hrv = buildNumericField(combined.hrv ?? [], ROW_BANDS.numeric);
  const calories = buildNumericField(combined.calories ?? [], ROW_BANDS.numeric);
  const workoutFrequency = buildRangeField(
    combined.workout_frequency ?? [],
    ROW_BANDS.workoutFrequency,
  );
  const alcoholDrinks = buildRangeField(combined.alcohol_drinks ?? [], ROW_BANDS.alcoholDrinks);
  const wakeupFeeling = buildFeelingField(combined.wakeup_feeling ?? [], ROW_BANDS.wakeupFeeling);
  const overallFeeling = buildFeelingField(
    combined.overall_feeling ?? [],
    ROW_BANDS.overallFeeling,
  );

  return dates.map((date, i) => ({
    x: i,
    date,
    weight_y: weight[i].y,
    weight_raw: weight[i].raw,
    sleep_hours_y: sleepHours[i].y,
    sleep_hours_raw: sleepHours[i].raw,
    resting_heart_rate_y: restingHeartRate[i].y,
    resting_heart_rate_raw: restingHeartRate[i].raw,
    hrv_y: hrv[i].y,
    hrv_raw: hrv[i].raw,
    calories_y: calories[i].y,
    calories_raw: calories[i].raw,
    workout_frequency_range: [workoutFrequency[i].y0, workoutFrequency[i].y],
    workout_frequency_raw: workoutFrequency[i].raw,
    alcohol_drinks_range: [alcoholDrinks[i].y0, alcoholDrinks[i].y],
    alcohol_drinks_raw: alcoholDrinks[i].raw,
    wakeup_feeling_range: [wakeupFeeling[i].y0, wakeupFeeling[i].y],
    wakeup_feeling_color: wakeupFeeling[i].color,
    wakeup_feeling_raw: wakeupFeeling[i].raw,
    overall_feeling_range: [overallFeeling[i].y0, overallFeeling[i].y],
    overall_feeling_color: overallFeeling[i].color,
    overall_feeling_raw: overallFeeling[i].raw,
  }));
}
