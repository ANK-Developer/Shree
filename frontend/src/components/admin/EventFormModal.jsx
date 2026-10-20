import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { createEvent, updateEvent } from "../../features/events/eventsSlice";
import { photoSrc } from "../../utils/format";
import { EVENT_STATUS, Modal, inputClass, toLocalInput } from "./eventUi";

const MAX_BANNER_SIZE = 2 * 1024 * 1024; // backend limit ke saath same

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

// event pass karo to edit mode, warna create
const EventFormModal = ({ event, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    eventName: event?.eventName || "",
    description: event?.description || "",
    venue: event?.venue || "",
    status: event?.status || "UPCOMING",
    startDateTime: toLocalInput(event?.startDateTime),
    endDateTime: toLocalInput(event?.endDateTime),
  });

  const [file, setFile] = useState(null);
  const [removeBanner, setRemoveBanner] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Naya file chuna ho to uska preview, warna maujooda banner (agar hataya nahi gaya)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  const shownBanner = preview || (!removeBanner && event?.eventBanner ? photoSrc(event.eventBanner) : null);

  const pickFile = (e) => {
    const picked = e.target.files[0];
    if (!picked) return;
    if (picked.size > MAX_BANNER_SIZE) {
      e.target.value = "";
      return toast.error("Banner must be 2MB or smaller");
    }
    setFile(picked);
    setRemoveBanner(false);
  };

  const clearBanner = () => {
    setFile(null);
    setRemoveBanner(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (new Date(form.endDateTime) <= new Date(form.startDateTime)) {
      return toast.error("End date and time must be after start date and time");
    }

    setSaving(true);
    const body = new FormData();
    Object.entries({
      ...form,
      startDateTime: new Date(form.startDateTime).toISOString(),
      endDateTime: new Date(form.endDateTime).toISOString(),
    }).forEach(([key, value]) => body.append(key, value));
    if (file) body.append("eventBanner", file);
    if (removeBanner) body.append("removeBanner", "true");

    try {
      const data = await dispatch(event ? updateEvent({ id: event._id, formData: body }) : createEvent(body)).unwrap();
      toast.success(event ? data.message : `${data.message} — ${data.participants} members added`);
      onSaved(data.event);
    } catch (message) {
      toast.error(message);
      setSaving(false);
    }
  };

  return (
    <Modal title={event ? "Edit Event" : "Create Event"} onClose={onClose} busy={saving} wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Event Name *">
          <input required maxLength={150} value={form.eventName} onChange={set("eventName")} className={inputClass} />
        </Field>
        <Field label="Description *">
          <textarea required rows={3} maxLength={5000} value={form.description} onChange={set("description")} className={inputClass} />
        </Field>
        <Field label="Venue *">
          <input required maxLength={300} value={form.venue} onChange={set("venue")} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start *">
            <input required type="datetime-local" value={form.startDateTime} onChange={set("startDateTime")} className={inputClass} />
          </Field>
          <Field label="End *">
            <input required type="datetime-local" value={form.endDateTime} onChange={set("endDateTime")} className={inputClass} />
          </Field>
        </div>
        <Field label="Status">
          <select value={form.status} onChange={set("status")} className={inputClass}>
            {Object.entries(EVENT_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Banner Image (optional, JPG/PNG/WEBP, max 2MB)">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-royal-100 file:px-4 file:py-2 file:font-semibold file:text-royal-700 hover:file:bg-royal-200" />
        </Field>
        {shownBanner && (
          <div className="relative">
            <img src={shownBanner} alt="Banner preview" className="w-full max-h-48 object-cover rounded-lg" />
            <button type="button" onClick={clearBanner} className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-black/80 px-3 py-1 text-xs font-semibold text-white">
              Remove
            </button>
          </div>
        )}

        {!event && <p className="text-xs text-gray-500">Event banne ke baad sabhi ACTIVE members automatically participants me add ho jayenge.</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-royal-600 hover:bg-royal-700 px-5 py-2 font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : event ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EventFormModal;
