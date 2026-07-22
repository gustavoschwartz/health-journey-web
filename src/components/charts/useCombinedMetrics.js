import { useEffect, useState } from "react";
import { getMetricsCombined } from "../../lib/api";
import { daysAgoISO, yesterdayISO } from "../../lib/dates";

/**
 * Fetches all nine /metrics/combined series in one call for the last `days`
 * days ending yesterday. Replaces Task 26/27/28's per-chart useMetricHistory
 * fetch (one call per metric, nine total) so the Combined View (Task 29)
 * loads with exactly one network call, and every chart on the page is
 * guaranteed to share the identical date range since they all read from the
 * same fetched response instead of nine independent ones.
 */
export function useCombinedMetrics(days) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    getMetricsCombined({ startDate: daysAgoISO(days), endDate: yesterdayISO() })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load charts.");
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  return { data, error };
}
