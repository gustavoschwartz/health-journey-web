import { useState } from "react";
import ConversationScreen from "./components/ConversationScreen";
import CheckinScreen from "./components/CheckinScreen";
import PasswordGate from "./components/PasswordGate";
import { isAuthenticated } from "./lib/auth";

const TABS = [
  { id: "conversation", label: "Conversation" },
  { id: "checkin", label: "Morning Check-in" },
];

function App() {
  const [activeTab, setActiveTab] = useState("conversation");
  const [authenticated, setAuthenticated] = useState(isAuthenticated);

  if (!authenticated) {
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4.5 w-4.5 text-white"
              >
                <path
                  d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2.2 4.5 5.8 4c2-.3 3.7.7 6.2 3 2.5-2.3 4.2-3.3 6.2-3 3.6.5 5.3 4.2 3.8 7.7C19.5 16.4 12 21 12 21z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              Health Journey
            </span>
          </div>

          <nav className="flex items-center gap-1 self-start rounded-full bg-slate-100 p-1 sm:self-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors sm:px-4 ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 justify-center px-3 py-4 sm:px-6 sm:py-8">
        <div className="flex w-full max-w-3xl min-h-0 flex-col">
          {activeTab === "conversation" ? <ConversationScreen /> : <CheckinScreen />}
        </div>
      </main>
    </div>
  );
}

export default App;
