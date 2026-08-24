import { useEffect, useState } from "react";
import {
  submitCheckin,
  getAlcoholEntries,
  submitAlcoholEntry,
  deleteAlcoholEntry,
} from "../lib/api";
import { yesterdayISO, monthDayLabel } from "../lib/dates";
import DailyRecapCard from "./DailyRecapCard";
import TodayRecapCard from "./TodayRecapCard";

const WORKOUT_FEELING_OPTIONS = [
  { value: "strong", label: "Strong", className: "border-teal-200 text-teal-700 hover:bg-teal-50" },
  { value: "normal", label: "Normal", className: "border-slate-200 text-slate-700 hover:bg-slate-50" },
  { value: "weak", label: "Weak", className: "border-amber-200 text-amber-700 hover:bg-amber-50" },
];

const OVERALL_FEELING_OPTIONS = [
  { value: "good", label: "Good", className: "border-teal-200 text-teal-700 hover:bg-teal-50" },
  { value: "neutral", label: "Neutral", className: "border-slate-200 text-slate-700 hover:bg-slate-50" },
  { value: "bad", label: "Bad", className: "border-amber-200 text-amber-700 hover:bg-amber-50" },
];

const ALCOHOL_TYPES = ["beer", "wine", "hard_liquor"];

function formatYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function CheckinScreen({ onGoToConversation }) {
  const [status, setStatus] = useState("loading"); // loading | active | complete | error
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [completeMessage, setCompleteMessage] = useState("");
  const [checkinRecap, setCheckinRecap] = useState(null);

  const [caloriesInput, setCaloriesInput] = useState("");
  const [alcoholEntries, setAlcoholEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [alcoholType, setAlcoholType] = useState("beer");
  const [alcoholDrinks, setAlcoholDrinks] = useState("");

  useEffect(() => {
    startCheckin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCaloriesInput("");
    resetAlcoholForm();
    if (currentPrompt?.field === "alcohol") {
      refreshAlcoholEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrompt?.field]);

  function resetAlcoholForm() {
    setEditingEntryId(null);
    setAlcoholType("beer");
    setAlcoholDrinks("");
  }

  async function refreshAlcoholEntries() {
    const res = await getAlcoholEntries({ date: yesterdayISO() });
    setAlcoholEntries(res.entries);
  }

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
      setCheckinRecap(res.checkin_recap ?? null);
      setCurrentPrompt(null);
      setStatus("complete");
    } else if (res.status === "pending") {
      setCurrentPrompt(res);
      setStatus("active");
    }
  }

  async function submitAnswer(field, value, displayAnswer, stravaId) {
    if (!currentPrompt || submitting) return;
    setSubmitting(true);
    const answeredPrompt = currentPrompt;

    try {
      const res = await submitCheckin({
        date: yesterdayISO(),
        field,
        value,
        stravaId,
      });

      if (res.status === "error") {
        setStatus("error");
        setErrorMessage(res.message);
        return;
      }

      setHistory((prev) => [
        ...prev,
        { prompt: answeredPrompt.next_prompt, answer: displayAnswer },
      ]);
      applyResponse(res);
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCaloriesSubmit(e) {
    e.preventDefault();
    const calories = Number(caloriesInput);
    if (!caloriesInput || Number.isNaN(calories)) return;
    submitAnswer("calories_previous_day", calories, `${calories} cal`);
  }

  function handleAlcoholDone() {
    const label =
      alcoholEntries.length === 0
        ? "None"
        : `${alcoholEntries.length} ${alcoholEntries.length === 1 ? "entry" : "entries"}`;
    submitAnswer("alcohol", undefined, label);
  }

  function handleAlcoholEdit(entry) {
    setEditingEntryId(entry.id);
    setAlcoholType(entry.type);
    setAlcoholDrinks(String(entry.drinks));
  }

  async function handleAlcoholAddOrUpdate(e) {
    e.preventDefault();
    const drinks = Number(alcoholDrinks);
    if (!alcoholDrinks || Number.isNaN(drinks) || drinks <= 0) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await submitAlcoholEntry({
        date: yesterdayISO(),
        type: alcoholType,
        drinks,
        entryId: editingEntryId,
      });
      if (res.status === "saved") {
        await refreshAlcoholEntries();
        resetAlcoholForm();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAlcoholDelete(entryId) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await deleteAlcoholEntry({ entryId });
      await refreshAlcoholEntries();
      if (editingEntryId === entryId) resetAlcoholForm();
    } finally {
      setSubmitting(false);
    }
  }

  const field = currentPrompt?.field;

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

          {/* Task 57e: available at any step, not just before the first
              question. Writes nothing -- check-in state is entirely derived
              from which fields are still null, so there's nothing to
              persist as "dismissed" -- and reuses the same
              navigate-to-conversation callback the recap screen's "Continue
              to Conversation" button already uses, since both mean exactly
              the same thing here: leave this screen, nothing more to do
              right now. */}
          {onGoToConversation && (
            <button
              type="button"
              onClick={onGoToConversation}
              disabled={submitting}
              className="mb-4 flex flex-col items-start text-left disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-[14px] font-medium text-slate-500 hover:text-slate-700">
                Not now
              </span>
              <span className="text-[12px] text-slate-400">
                You can always come back to this later.
              </span>
            </button>
          )}

          {field === "wakeup_feeling" && (
            <div className="flex gap-2">
              {OVERALL_FEELING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => submitAnswer("wakeup_feeling", opt.value, opt.value)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${opt.className}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {field === "workout_feeling" && (
            <div className="flex gap-2">
              {WORKOUT_FEELING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    submitAnswer("workout_feeling", opt.value, opt.value, currentPrompt.strava_id)
                  }
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${opt.className}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {field === "overall_feeling" && (
            <div className="flex gap-2">
              {OVERALL_FEELING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={submitting}
                  onClick={() => submitAnswer("overall_feeling", opt.value, opt.value)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${opt.className}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {field === "calories_previous_day" && (
            <form onSubmit={handleCaloriesSubmit} className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                autoFocus
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(e.target.value)}
                placeholder="e.g. 2100"
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[14px] outline-none placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={submitting || !caloriesInput}
                className="rounded-xl bg-teal-600 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit
              </button>
            </form>
          )}

          {field === "alcohol" && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                {alcoholEntries.length === 0 ? (
                  <p className="text-[13px] text-slate-400">No drinks logged yet.</p>
                ) : (
                  alcoholEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => handleAlcoholEdit(entry)}
                        disabled={submitting}
                        className="text-left text-[14px] capitalize text-slate-700 hover:text-teal-700 disabled:cursor-not-allowed"
                      >
                        {entry.type.replace("_", " ")} - {entry.drinks}{" "}
                        {entry.drinks === 1 ? "drink" : "drinks"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAlcoholDelete(entry.id)}
                        disabled={submitting}
                        className="text-[13px] font-medium text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAlcoholAddOrUpdate} className="flex gap-2">
                <select
                  value={alcoholType}
                  onChange={(e) => setAlcoholType(e.target.value)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] capitalize outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
                >
                  {ALCOHOL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={alcoholDrinks}
                  onChange={(e) => setAlcoholDrinks(e.target.value)}
                  placeholder="Drinks"
                  disabled={submitting}
                  className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[14px] outline-none placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting || !alcoholDrinks}
                  className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {editingEntryId ? "Update" : "Add"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleAlcoholDone}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {status === "complete" && checkinRecap && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-teal-600">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900">Check-In Complete</h2>
          </div>

          <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            {`Yesterday, ${monthDayLabel(checkinRecap.yesterday.date)}`}
          </p>
          <DailyRecapCard recap={checkinRecap.yesterday} />

          <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            {`This morning, ${monthDayLabel(checkinRecap.today.date)}`}
          </p>
          <TodayRecapCard recap={checkinRecap.today} />

          {onGoToConversation && (
            <button
              type="button"
              onClick={onGoToConversation}
              className="self-start rounded-xl bg-teal-600 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-teal-700"
            >
              Continue to Conversation
            </button>
          )}
        </div>
      )}

      {status === "complete" && !checkinRecap && (
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
