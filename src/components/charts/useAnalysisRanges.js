import { useEffect, useState } from "react";
import {
  getOvernightHrvRange,
  getOvernightRestingHrRange,
  getSleepNeedRange,
  getTrainingLoadRange,
} from "../../lib/api";
import { daysAgoISO, yesterdayISO } from "../../lib/dates";

const LOADING = { data: null, error: false };

/**
 * Task 82: the /analysis range fetches behind the Charts screen's analysis
 * cards, four of them since Task 83 added the two overnight components, started together for the same range useCombinedMetrics
 * reads, and again on each range change. Each keeps its own state, so one
 * failing leaves the other's cards drawn. A response for a range the user has
 * already left is dropped, as in useCombinedMetrics.
 */
export function useAnalysisRanges(days) {
  const [trainingLoad, setTrainingLoad] = useState(LOADING);
  const [sleepNeed, setSleepNeed] = useState(LOADING);
  // Task 83: two more of the same shape, so each keeps its own loading and
  // error state and one failing leaves the others drawn.
  const [overnightHrv, setOvernightHrv] = useState(LOADING);
  const [overnightRestingHr, setOvernightRestingHr] = useState(LOADING);

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
    track(getOvernightHrvRange(range), setOvernightHrv);
    track(getOvernightRestingHrRange(range), setOvernightRestingHr);

    return () => {
      cancelled = true;
    };
  }, [days]);

  return { trainingLoad, sleepNeed, overnightHrv, overnightRestingHr };
}
