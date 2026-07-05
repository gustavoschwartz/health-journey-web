import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { streamConversation, streamSync } from "../lib/api";
import { getLastSyncedDate, setLastSyncedDate } from "../lib/dates";
import ToolCallChip from "./ToolCallChip";

const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-black/5 px-1 py-0.5 text-[13px]">{children}</code>
  ),
};

function updateMessage(messages, id, updater) {
  return messages.map((m) => (m.id === id ? updater(m) : m));
}

function SyncStatus({ syncState }) {
  if (!syncState) return null;

  if (syncState.status === "running") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-slate-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
        Syncing…
        {syncState.events.length > 0 && (
          <span className="text-slate-400">
            {syncState.events[syncState.events.length - 1].date}
          </span>
        )}
      </div>
    );
  }

  if (syncState.status === "done") {
    return (
      <div className="text-[13px] text-slate-500">
        Synced through{" "}
        <span className="font-medium text-slate-700">
          {syncState.syncedThrough}
        </span>
      </div>
    );
  }

  if (syncState.status === "error") {
    return (
      <div className="text-[13px] text-rose-600">
        Sync failed: {syncState.error}
      </div>
    );
  }

  return null;
}

export default function ConversationScreen() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [syncState, setSyncState] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    const userMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const assistantMsg = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolEvents: [],
      error: false,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    try {
      for await (const event of streamConversation({ sessionId, message: text })) {
        if (event.type === "token") {
          setMessages((prev) =>
            updateMessage(prev, assistantId, (m) => ({
              ...m,
              content: m.content + event.value,
            }))
          );
        } else if (event.type === "tool_call") {
          setMessages((prev) =>
            updateMessage(prev, assistantId, (m) => ({
              ...m,
              toolEvents: [
                ...m.toolEvents,
                { tool: event.tool, label: event.label, status: "running" },
              ],
            }))
          );
        } else if (event.type === "tool_result") {
          setMessages((prev) =>
            updateMessage(prev, assistantId, (m) => {
              const toolEvents = [...m.toolEvents];
              const idx = [...toolEvents]
                .reverse()
                .findIndex((te) => te.status === "running");
              if (idx !== -1) {
                const realIdx = toolEvents.length - 1 - idx;
                toolEvents[realIdx] = { ...toolEvents[realIdx], status: event.status };
              }
              return { ...m, toolEvents };
            })
          );
        } else if (event.type === "error") {
          setMessages((prev) =>
            updateMessage(prev, assistantId, (m) => ({
              ...m,
              content: m.content || `Something went wrong: ${event.message}`,
              error: true,
            }))
          );
        }
      }
    } catch {
      setMessages((prev) =>
        updateMessage(prev, assistantId, (m) => ({
          ...m,
          content: m.content || "Couldn't reach the server. Please try again.",
          error: true,
        }))
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSync() {
    if (syncState?.status === "running") return;

    setSyncState({ status: "running", events: [] });
    const lastSynced = getLastSyncedDate();
    let syncedThrough = lastSynced;

    try {
      for await (const event of streamSync({ lastSyncedDate: lastSynced })) {
        if (event.type === "progress") {
          setSyncState((prev) => ({ ...prev, events: [...prev.events, event] }));
        } else if (event.type === "done") {
          syncedThrough = event.synced_through;
        }
      }
      setLastSyncedDate(syncedThrough);
      setSyncState({ status: "done", events: [], syncedThrough });
    } catch (err) {
      setSyncState({ status: "error", events: [], error: err.message });
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <SyncStatus syncState={syncState} />
        <button
          type="button"
          onClick={handleSync}
          disabled={syncState?.status === "running"}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-3.5 w-3.5 ${syncState?.status === "running" ? "animate-spin" : ""}`}
          >
            <path d="M15.3 4.3a1 1 0 011.4 1.4l-1.1 1.1A6.5 6.5 0 0116.5 10a1 1 0 11-2 0 4.5 4.5 0 00-7.7-3.2L5.7 7.9A1 1 0 014.3 6.5l1.1-1.1a6.5 6.5 0 0110.9-.1zM4.7 15.7a1 1 0 01-1.4-1.4l1.1-1.1A6.5 6.5 0 013.5 10a1 1 0 112 0 4.5 4.5 0 007.7 3.2l1.1-1.1a1 1 0 011.4 1.4l-1.1 1.1a6.5 6.5 0 01-10.9.1z" />
          </svg>
          Sync
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-400">
            <p className="text-[15px] font-medium text-slate-500">
              Ask about your health data
            </p>
            <p className="max-w-sm text-[13px]">
              e.g. &ldquo;Why did I feel tired last Tuesday?&rdquo; or &ldquo;How
              has my training load looked this week?&rdquo;
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-teal-600 text-white"
                      : m.error
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.role === "assistant" && m.toolEvents?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.toolEvents.map((te, i) => (
                        <ToolCallChip key={i} label={te.label} status={te.status} />
                      ))}
                    </div>
                  )}
                  {m.role === "assistant" ? (
                    <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                  {m.role === "assistant" &&
                    isStreaming &&
                    m.id === messages[messages.length - 1].id && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-slate-400 align-middle" />
                    )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-slate-100 px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your health data…"
          disabled={isStreaming}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[14px] outline-none placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M3.4 2.5a.75.75 0 01.8-.05l13 7.5a.75.75 0 010 1.3l-13 7.5a.75.75 0 01-1.12-.78l1.7-6.4a.25.25 0 01.24-.18h5.98a.75.75 0 000-1.5H5.02a.25.25 0 01-.24-.18l-1.7-6.4a.75.75 0 01.32-.8z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
