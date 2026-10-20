import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/admin/ConfirmModal";
import EventFormModal from "../../components/admin/EventFormModal";
import Pagination from "../../components/admin/Pagination";
import { EVENT_STATUS, formatDateTime, inputClass } from "../../components/admin/eventUi";
import { fetchEvents, updateEventStatus } from "../../features/events/eventsSlice";

const LIMIT = 10;

const Events = () => {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.events);
  const isLoading = Boolean(loading["events/fetch"]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // edit hone wala event
  const [pendingStatus, setPendingStatus] = useState(null); // { event, status } confirmation ke liye
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    try {
      await dispatch(fetchEvents({ page, limit: LIMIT, search, status })).unwrap();
    } catch (message) {
      toast.error(message);
    }
  }, [dispatch, page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const confirmStatusChange = async () => {
    setChanging(true);
    try {
      const data = await dispatch(updateEventStatus({ id: pendingStatus.event._id, status: pendingStatus.status })).unwrap();
      toast.success(data.message);
      setPendingStatus(null);
      load();
    } catch (message) {
      toast.error(message);
    }
    setChanging(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold text-royal-900">Events</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search event..." className={`${inputClass} sm:w-56`} />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={`${inputClass} sm:w-40`}
          >
            <option value="">All Status</option>
            {Object.entries(EVENT_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-royal-600 hover:bg-royal-700 px-4 py-2 font-semibold text-white whitespace-nowrap">
            + Create Event
          </button>
        </div>
      </div>

      <div className={`overflow-x-auto transition-opacity ${isLoading && list.length ? "opacity-60" : ""}`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-royal-100 text-royal-900">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Date & Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Participants</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && list.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                  No events found
                </td>
              </tr>
            ) : (
              list.map((e) => (
                <tr key={e._id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.eventName}</p>
                    <p className="text-xs text-gray-500">{e.venue}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(e.startDateTime)}</td>
                  <td className="px-4 py-3">
                    {/* Controlled select: confirm na hone par apne aap purani value par laut jata hai */}
                    <select
                      value={e.status}
                      onChange={(ev) => setPendingStatus({ event: e, status: ev.target.value })}
                      className={`rounded-full px-2 py-1 text-xs font-semibold border-0 cursor-pointer ${EVENT_STATUS[e.status].cls}`}
                    >
                      {Object.entries(EVENT_STATUS).map(([value, { label }]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    <span className="font-semibold text-royal-900">{e.counts.total} total</span>
                    <span className="text-green-700"> · {e.counts.ACCEPTED} yes</span>
                    <span className="text-red-600"> · {e.counts.REJECTED} no</span>
                    <span className="text-yellow-700"> · {e.counts.NOT_CONFIRMED} pending</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/events/${e._id}`} className="rounded-lg bg-royal-600 hover:bg-royal-700 px-3 py-1.5 text-xs font-semibold text-white transition">
                        View
                      </Link>
                      <button onClick={() => setEditing(e)} className="rounded-lg border border-royal-600 text-royal-700 hover:bg-royal-100 px-3 py-1.5 text-xs font-semibold transition">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination {...pagination} onChange={setPage} />

      {showForm && (
        <EventFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
      {editing && (
        <EventFormModal
          event={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {pendingStatus && (
        <ConfirmModal
          danger={pendingStatus.status === "CANCELLED"}
          title="Change event status?"
          message={`"${pendingStatus.event.eventName}" ka status ${EVENT_STATUS[pendingStatus.event.status].label} se ${EVENT_STATUS[pendingStatus.status].label} karna hai?`}
          confirmText="Yes, change"
          loading={changing}
          onConfirm={confirmStatusChange}
          onCancel={() => setPendingStatus(null)}
        />
      )}
    </div>
  );
};

export default Events;
