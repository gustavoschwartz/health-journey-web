const STATUS_STYLES = {
  running: "border-amber-200 bg-amber-50 text-amber-700",
  success: "border-teal-200 bg-teal-50 text-teal-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function ToolCallChip({ label, status }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.running}`}
    >
      {status === "running" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      )}
      {status === "success" && (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === "error" && (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 102 0V6a1 1 0 10-2 0v4zm1 4a1.1 1.1 0 100-2.2 1.1 1.1 0 000 2.2z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {label}
    </div>
  );
}
