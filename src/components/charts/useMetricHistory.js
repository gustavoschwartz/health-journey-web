import { useEffect, useState } from "react";
import { getMetricHistory } from "../../lib/api";
import { daysAgoISO, yesterdayISO } from "../../lib/dates";

/** Fetches /metrics/history for one metric over the last `days` days ending
 * yesterday. Shared by every chart component (line, bar, and whatever
 * Task 28/29 add) so the fetch/loading/error handling lives in one place. */
export function useMetricHistory(metric, days) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    getMetricHistory({ metric, startDate: daysAgoISO(days), endDate: yesterdayISO() })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this chart.");
      });

    return () => {
      cancelled = true;
    };
  }, [metric, days]);

  return { data, error };
}
