import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getRangeData, streamConversation, streamSync } from "../lib/api";
import { getLastSyncedDate, setLastSyncedDate } from "../lib/dates";
import { itemsFromRangeResponse } from "../lib/formatDataItem";
import ToolCallChip from "./ToolCallChip";
import PaginatedDataList from "./PaginatedDataList";
import DailyRecapCard from "./DailyRecapCard";

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

// Task 12d: strips the same handful of markdown syntax characters
// MARKDOWN_COMPONENTS/ReactMarkdown already parses (bold, lists, links,
// headings) before speaking a reply aloud — SpeechSynthesisUtterance has no
// markdown awareness of its own, so unstripped text would have the voice
// literally reading out asterisks, dashes, and link brackets. The opposite
// of Task 12c's Copy button, deliberately — see handleCopy's comment.
function stripMarkdownForSpeech(text) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) -> text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold** -> bold
    .replace(/\*([^*]+)\*/g, "$1") // *italic* -> italic
    .replace(/^#{1,6}\s+/gm, "") // # Heading -> Heading
    .replace(/^[-*+]\s+/gm, ""); // - item / * item -> item
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

// onCheckinReset (Task 55): fired when a checkin_reset SSE event arrives —
// App.jsx switches the active tab to "checkin", the same mechanism Task 53
// added for the recap's "Continue to Conversation" button, used in reverse.
// onCheckinRequested (Task 57e): fired when a checkin_requested SSE event
// arrives -- mirrors onCheckinReset exactly in the opposite direction.
export default function ConversationScreen({ onCheckinReset, onCheckinRequested } = {}) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [syncState, setSyncState] = useState(null);
  // Task 12c: which message (if any) is currently showing "Copied" — only
  // one at a time, since clicking a new Copy button just moves the
  // confirmation rather than stacking it.
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  // The pending "revert to idle" timer for copiedMessageId — cleared and
  // rescheduled on every tap (mirrors HealthJourneyApp's copyTimeoutRef), so
  // tapping the same message's Copy button twice within 2s extends the
  // confirmation instead of an earlier tap's stale timer clearing it early.
  const copyTimeoutRef = useRef(null);
  // Task 12d: which assistant message (if any) is currently being read
  // aloud — only one at a time, same single-tracker shape as copiedMessageId.
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const bottomRef = useRef(null);

  // Task 12c: copies the raw markdown source already held in state, not
  // ReactMarkdown's rendered DOM, so a copied list pastes back as "- item"
  // lines rather than being silently reformatted or stripped.
  function handleCopy(id, text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedMessageId(id);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopiedMessageId((prev) => (prev === id ? null : prev));
          copyTimeoutRef.current = null;
        }, 2000);
      })
      .catch(() => {
        // Write denied/failed (permissions, insecure context) — leave
        // copiedMessageId untouched rather than showing "Copied" for a
        // copy that didn't actually happen.
      });
  }

  // Task 12d: unlike iPhone's Tts (a single global NativeEventEmitter, where
  // a stale event from an already-superseded utterance needs an explicit
  // utteranceId match to avoid clearing a *newer* message's speaking state —
  // see ConversationScreen.tsx's currentUtteranceIdRef), each
  // SpeechSynthesisUtterance here gets its own onend/onerror closure bound
  // to the specific `id` it was created for. A late event from a cancelled
  // utterance can only ever match its own (now-stale) id, so the `prev ===
  // id` guard alone is enough — no separate id-tracking ref needed on web.
  function handlePlayToggle(id, text) {
    window.speechSynthesis.cancel();
    if (speakingMessageId === id) {
      setSpeakingMessageId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utterance.onend = () => {
      setSpeakingMessageId((prev) => (prev === id ? null : prev));
    };
    utterance.onerror = () => {
      setSpeakingMessageId((prev) => (prev === id ? null : prev));
    };
    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  }

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
      pagination: null,
      dailyRecap: null,
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
        } else if (event.type === "pagination") {
          setMessages((prev) =>
            updateMessage(prev, assistantId, (m) => ({
              ...m,
              pagination: {
                source: event.source,
                fromDate: event.from_date,
                toDate: event.to_date,
                nextOffset: event.next_offset,
                totalMatched: event.total_matched,
                items: [],
                loading: false,
              },
            }))
          );
        } else if (event.type === "day_recap") {
          // get_day_recap's result, rendered as the same card
          // CheckinScreen's Check-In Complete state uses instead of
          // Claude re-typing every field back in prose. type is the only
          // key not part of the DailyRecap shape.
          const { type: _type, ...recap } = event;
          setMessages((prev) =>
            updateMessage(prev, assistantId, (m) => ({
              ...m,
              dailyRecap: recap,
            }))
          );
        } else if (event.type === "checkin_reset") {
          // redo_checkin's result (Task 55) — same "deterministic event
          // the client acts on directly" precedent as day_recap above,
          // but this one changes which tab is shown next rather than
          // rendering a card. Only ever emitted on a genuine reset.
          onCheckinReset?.();
        } else if (event.type === "checkin_requested") {
          // request_checkin's result (Task 57e) — mirrors checkin_reset's
          // own precedent in the opposite direction. Only ever emitted when
          // the sequence is actually still incomplete, never on
          // already_complete.
          onCheckinRequested?.();
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

  async function handleShowMore(messageId) {
    const message = messages.find((m) => m.id === messageId);
    const pagination = message?.pagination;
    if (!pagination || pagination.nextOffset == null || pagination.loading) return;

    setMessages((prev) =>
      updateMessage(prev, messageId, (m) => ({
        ...m,
        pagination: { ...m.pagination, loading: true },
      }))
    );

    try {
      const body = await getRangeData({
        source: pagination.source,
        fromDate: pagination.fromDate,
        toDate: pagination.toDate,
        offset: pagination.nextOffset,
      });
      const newItems = itemsFromRangeResponse(pagination.source, body);

      setMessages((prev) =>
        updateMessage(prev, messageId, (m) => ({
          ...m,
          pagination: {
            ...m.pagination,
            items: [...m.pagination.items, ...newItems],
            nextOffset: body.next_offset,
            totalMatched: body.total_matched,
            loading: false,
          },
        }))
      );
    } catch {
      setMessages((prev) =>
        updateMessage(prev, messageId, (m) => ({
          ...m,
          pagination: { ...m.pagination, loading: false },
        }))
      );
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
                  className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                    m.dailyRecap ? "w-full max-w-2xl" : "max-w-[80%]"
                  } ${
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
                  {m.content ? (
                    <div className="mt-1.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.content)}
                        className={`text-[11px] ${
                          m.role === "user"
                            ? "text-teal-100 hover:text-white"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {copiedMessageId === m.id ? "✓ Copied" : "📋 Copy"}
                      </button>
                      {m.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => handlePlayToggle(m.id, m.content)}
                          className="text-[11px] text-slate-400 hover:text-slate-600"
                        >
                          {speakingMessageId === m.id ? "⏹ Stop" : "▶️ Play"}
                        </button>
                      )}
                    </div>
                  ) : null}
                  {m.role === "assistant" &&
                    isStreaming &&
                    m.id === messages[messages.length - 1].id && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-slate-400 align-middle" />
                    )}
                  {m.role === "assistant" && m.pagination && (
                    <PaginatedDataList
                      pagination={m.pagination}
                      loading={m.pagination.loading}
                      onShowMore={() => handleShowMore(m.id)}
                    />
                  )}
                  {m.role === "assistant" && m.dailyRecap && (
                    <div className="mt-2">
                      <DailyRecapCard recap={m.dailyRecap} />
                    </div>
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
