import { useState } from "react";
import { toast } from "react-toastify";
import api from "../../services/api";
import { downloadMembersPdf } from "../../utils/membersPdf";
import { Modal } from "./eventUi";

const cap = (s) => s.charAt(0) + s.slice(1).toLowerCase();

// filters: { search, status, type } - table me jo filter laga hai wahi PDF me aata hai
const MembersPdfButton = ({ filters, total }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const label = [filters.status && cap(filters.status), filters.type, filters.search && `"${filters.search}"`].filter(Boolean).join(" · ") || "All";

  const run = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/members/export", { params: filters });
      if (!data.members.length) toast.info("No members to download");
      else await downloadMembersPdf(data.members, label);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "PDF download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-xl bg-gold-500 hover:bg-gold-600 px-4 py-2.5 text-sm font-semibold text-royal-900 whitespace-nowrap transition">
        Download PDF
      </button>
      {open && (
        <Modal title="Download Members PDF" onClose={() => setOpen(false)} busy={busy}>
          {busy ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-royal-600" />
              <p className="text-sm font-medium text-gray-700">Generating PDF, please wait...</p>
            </div>
          ) : (
            <p className="text-gray-700">
              <span className="font-semibold text-royal-900">{total}</span> member{total === 1 ? "" : "s"} ({label}) will be downloaded as a PDF. Do you want to continue?
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setOpen(false)} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Close
            </button>
            <button onClick={run} disabled={busy || total === 0} className="rounded-lg bg-royal-600 hover:bg-royal-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white">
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Preparing...
                </span>
              ) : (
                "Yes, Download"
              )}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default MembersPdfButton;
