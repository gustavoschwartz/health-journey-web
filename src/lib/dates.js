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

const LAST_SYNCED_KEY = "hj_last_synced_date";

export function getLastSyncedDate() {
  return localStorage.getItem(LAST_SYNCED_KEY) ?? daysAgoISO(7);
}

export function setLastSyncedDate(date) {
  localStorage.setItem(LAST_SYNCED_KEY, date);
}
