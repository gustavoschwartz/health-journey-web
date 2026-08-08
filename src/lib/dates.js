export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function todayISO() {
  return toISODate(new Date());
}

export function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

export function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

/** Monday of the week containing dateStr ("YYYY-MM-DD"), same "yyyy-mm-dd
 * string in, arithmetic via local Date, string out via toISODate" pattern
 * as daysAgoISO above. getDay() is 0 for Sunday, so the offset back to
 * Monday is 6 on a Sunday, day-1 otherwise. */
export function mondayOfISO(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/** This week's Monday, current_week_start in the backend's terms (Task 46). */
export function currentWeekStartISO() {
  return mondayOfISO(todayISO());
}

/** The most recently *completed* week's Monday — current_week_start minus
 * 7 days, the same "last week" resolution the orchestrator's system prompt
 * uses (Task 46), and the default week the Weekly Summary screen opens to. */
export function mostRecentCompletedWeekStartISO() {
  return addDaysISO(currentWeekStartISO(), -7);
}

export function addDaysISO(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const LAST_SYNCED_KEY = "hj_last_synced_date";

export function getLastSyncedDate() {
  return localStorage.getItem(LAST_SYNCED_KEY) ?? daysAgoISO(7);
}

export function setLastSyncedDate(date) {
  localStorage.setItem(LAST_SYNCED_KEY, date);
}
