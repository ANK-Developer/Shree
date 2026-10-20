export const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-royal-500";

export const EVENT_STATUS = {
  UPCOMING: { label: "Upcoming", cls: "bg-blue-100 text-blue-700" },
  LIVE: { label: "Live", cls: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Completed", cls: "bg-gray-200 text-gray-700" },
  CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-700" },
};

export const PARTICIPATION = {
  ACCEPTED: { label: "Accepted", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
  NOT_CONFIRMED: { label: "Not Confirmed", cls: "bg-yellow-100 text-yellow-700" },
};

export const CALL_STATUS = {
  ANSWERED: { label: "Answered", cls: "bg-green-100 text-green-700" },
  NOT_ANSWERED: { label: "Not Answered", cls: "bg-red-100 text-red-700" },
  BUSY: { label: "Busy", cls: "bg-yellow-100 text-yellow-700" },
  FAILED: { label: "Failed", cls: "bg-gray-200 text-gray-700" },
  PENDING: { label: "Pending", cls: "bg-blue-100 text-blue-700" },
};

export const Badge = ({ map, value }) => {
  const item = map[value];
  if (!item) return <span className="text-gray-400">—</span>;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${item.cls}`}>{item.label}</span>;
};

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// <input type="datetime-local"> local time string maangta hai (ISO/UTC nahi)
export const toLocalInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const Modal = ({ title, onClose, busy, children, wide }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-6 overflow-y-auto" onClick={busy ? undefined : onClose}>
    <div role="dialog" aria-modal="true" className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} bg-white rounded-2xl shadow-xl p-6`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-royal-900">{title}</h3>
        <button type="button" onClick={onClose} disabled={busy} className="text-2xl leading-none text-gray-400 hover:text-gray-600" aria-label="Close">
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);
