import { useState } from "react";
import { checkPassword, markAuthenticated } from "../lib/auth";

export default function PasswordGate({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (checkPassword(password)) {
      markAuthenticated();
      onSuccess();
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <path
                d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.2 4.5 5.8 4c2-.3 3.7.7 6.2 3 2.5-2.3 4.2-3.3 6.2-3 3.6.5 5.3 4.2 3.8 7.7C19.5 16.4 12 21 12 21z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-[16px] font-semibold text-slate-900">Health Journey</h1>
          <p className="text-[13px] text-slate-500">Enter the password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className={`rounded-xl border px-4 py-2.5 text-[14px] outline-none placeholder:text-slate-400 focus:ring-2 ${
              error
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-teal-400 focus:ring-teal-100"
            }`}
          />
          {error && (
            <p className="text-[13px] text-rose-600">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            disabled={!password}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
