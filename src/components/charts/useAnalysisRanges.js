import { useEffect, useState } from "react";
import { getSleepNeedRange, getTrainingLoadRange } from "../../lib/api";
import { daysAgoISO, yesterdayISO } from "../../lib/dates";

const LOADING = { data: null, error: false };

/**
 * Task 82: the two /analysis range fetches behind the Charts screen's
 * analysis cards, started together for the same range useCombinedMetrics
 * reads, and again on each range change. Each keeps its own state, so one
 * failing leaves the other's cards drawn. A response for a range the user has
 * already left is dropped, as in useCombinedMetrics.
 */
export function useAnalysisRanges(days) {
  const [trainingLoad, setTrainingLoad] = useState(LOADING);
  const [sleepNeed, setSleepNeed] = useState(LOADING);

  useEffect(() => {
    let cancelled = false;
    const range = { fromDate: daysAgoISO(days), toDate: yesterdayISO() };

    function track(request, setRange) {
      setRange(LOADING);
      request
        .then((data) => {
          if (!cancelled) setRange({ data, error: false });
        })
        .catch(() => {
          if (!cancelled) setRange({ data: null, error: true });
        });
    }

    track(getTrainingLoadRange(range), setTrainingLoad);
    track(getSleepNeedRange(range), setSleepNeed);

    return () => {
      cancelled = true;
    };
  }, [days]);

  return { trainingLoad, sleepNeed };
}
