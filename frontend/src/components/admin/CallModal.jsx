import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { addCall } from "../../features/events/eventsSlice";
import { fullName } from "../../utils/format";
import Avatar from "./Avatar";
import { CALL_STATUS, Modal, PARTICIPATION, inputClass, toLocalInput } from "./eventUi";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

// Sirf naya call log karne ka form (history alag "Logs" modal me hai)
const CallModal = ({ eventId, participant, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const { member } = participant;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    callStatus: "ANSWERED",
    callResponse: "",
    participationStatus: participant.participationStatus,
    calledAt: toLocalInput(new Date()),
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dispatch(
        addCall({
          id: eventId,
          participantId: participant._id,
          callStatus: form.callStatus,
          callResponse: form.callResponse,
          participationStatus: form.participationStatus,
          calledAt: new Date(form.calledAt).toISOString(),
        }),
      ).unwrap();
      toast.success("Call saved");
      onSaved();
    } catch (message) {
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <Modal title="Call Member" onClose={onClose} busy={saving}>
      <div className="flex items-center gap-3 mb-5">
        <Avatar member={member} className="h-12 w-12" />
        <div>
          <p className="font-semibold text-royal-900">{fullName(member)}</p>
          <a href={`tel:${member.mobileNumber}`} className="text-sm text-royal-600 hover:underline">
            {member.mobileNumber}
          </a>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Call Status">
            <select value={form.callStatus} onChange={set("callStatus")} className={inputClass}>
              {Object.entries(CALL_STATUS)
                .filter(([value]) => value !== "PENDING")
                .map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Participant Status">
            <select value={form.participationStatus} onChange={set("participationStatus")} className={inputClass}>
              {Object.entries(PARTICIPATION).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Call Date & Time">
          <input required type="datetime-local" max={toLocalInput(new Date())} value={form.calledAt} onChange={set("calledAt")} className={inputClass} />
        </Field>

        <Field label="Call Response">
          <textarea rows={3} maxLength={1000} value={form.callResponse} onChange={set("callResponse")} placeholder="e.g. Will confirm tomorrow" className={inputClass} />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-leaf hover:opacity-90 px-5 py-2 font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : "Save Call"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CallModal;
