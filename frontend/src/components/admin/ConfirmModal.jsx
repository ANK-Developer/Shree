// Reusable confirmation modal. danger=true -> red confirm button, warna green
const ConfirmModal = ({ title, message, confirmText = "Confirm", danger = false, loading = false, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={loading ? undefined : onCancel}>
    <div
      role="dialog"
      aria-modal="true"
      className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-bold text-royal-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-2">{message}</p>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-60 ${
            danger ? "bg-red-500 hover:bg-red-600" : "bg-leaf hover:opacity-90"
          }`}
        >
          {loading ? "Please wait..." : confirmText}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
