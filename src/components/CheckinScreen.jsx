import { useEffect, useState } from "react";
import { submitCheckin } from "../lib/api";
import { yesterdayISO } from "../lib/dates";

const FEELING_OPTIONS = [
  { value: "strong", label: "Strong", className: "border-teal-200 text-teal-700 hover:bg-teal-50" },
  { value: "normal", label: "Normal", className: "border-slate-200 text-slate-700 hover:bg-slate-50" },
  { value: "weak", label: "Weak", className: "border-amber-200 text-amber-700 hover:bg-amber-50" },
];

function formatYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function CheckinScreen() {
  const [status, setStatus] = useState("loading"); // loading | active | complete | error
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");

  useEffect(() => {
    startCheckin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCheckin() {
    setStatus("loading");
    try {
      const res = await submitCheckin({ date: yesterdayISO(), field: "start" });
      applyResponse(res);
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Please try again.");
    }
  }

  function applyResponse(res) {
    if (res.status === "error") {
      setStatus("error");
      setErrorMessage(res.message);
    } else if (res.status === "complete") {
      setCompleteMessage(res.message ?? "You're all caught up.");
      setCurrentPrompt(null);
      setStatus("complete");
    } else if (res.status === "pending") {
      setCurrentPrompt(res);
      setStatus("active");
    }
  }

  async function handleAnswer(feeling) {
    if (!currentPrompt || submitting) return;
    setSubmitting(true);
    const answeredPrompt = currentPrompt;

    try {
      const res = await submitCheckin({
        date: yesterdayISO(),
        field: "workout_feeling",
        value: feeling,
        stravaId: answeredPrompt.strava_id,
      });

      if (res.status === "error") {
        setStatus("error");
        setErrorMessage(res.message);
        return;
      }

      setHistory((prev) => [
        ...prev,
        { prompt: answeredPrompt.next_prompt, answer: feeling },
      ]);
      applyResponse(res);
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-[17px] font-semibold text-slate-900">Morning Check-in</h1>
        <p className="text-[13px] text-slate-500">Reviewing yesterday, {formatYesterday()}</p>
      </div>

      {history.length > 0 && (
        <div className="mb-5 flex flex-col gap-2">
          {history.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-[13px]"
            >
              <span className="text-slate-500">{h.prompt}</span>
              <span className="flex items-center gap-1.5 font-medium capitalize text-teal-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {h.answer}
              </span>
            </div>
          ))}
        </div>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-2 py-10 text-[14px] text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
          Checking for anything to review…
        </div>
      )}

      {status === "active" && currentPrompt && (
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="mb-4 text-[15px] leading-relaxed text-slate-800">
            {currentPrompt.next_prompt}
          </p>
          <div className="flex gap-2">
            {FEELING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={submitting}
                onClick={() => handleAnswer(opt.value)}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${opt.className}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === "complete" && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-teal-600">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-slate-700">{completeMessage}</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-[14px] text-rose-600">{errorMessage}</p>
          <button
            type="button"
            onClick={startCheckin}
            className="rounded-lg border border-slate-200 px-4 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
