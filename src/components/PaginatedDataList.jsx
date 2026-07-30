import { formatDataItem } from "../lib/formatDataItem";

/**
 * Renders the "Show 50 more" affordance plus any pages already fetched
 * (Task 36). Fetched pages are shown as a plain list — not narrated by the
 * orchestrator — directly under the assistant's message.
 */
export default function PaginatedDataList({ pagination, onShowMore, loading }) {
  if (!pagination) return null;
  const { source, items } = pagination;

  return (
    <div className="mt-2 border-t border-slate-200 pt-2">
      {items.length > 0 && (
        <ul className="mb-2 space-y-1 text-[13px] text-slate-600">
          {items.map((item, i) => (
            <li key={i}>{formatDataItem(source, item)}</li>
          ))}
        </ul>
      )}
      {pagination.nextOffset != null && (
        <button
          type="button"
          onClick={onShowMore}
          disabled={loading}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Loading…"
            : `Show 50 more of ${pagination.totalMatched}`}
        </button>
      )}
    </div>
  );
}
