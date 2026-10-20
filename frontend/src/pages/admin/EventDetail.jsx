import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Avatar from "../../components/admin/Avatar";
import CallLogsModal from "../../components/admin/CallLogsModal";
import CallModal from "../../components/admin/CallModal";
import EventFormModal from "../../components/admin/EventFormModal";
import Pagination from "../../components/admin/Pagination";
import { Badge, CALL_STATUS, EVENT_STATUS, PARTICIPATION, formatDateTime, inputClass } from "../../components/admin/eventUi";
import { fetchEvent, fetchParticipants, syncParticipants } from "../../features/events/eventsSlice";
import { fullName, photoSrc } from "../../utils/format";

const LIMIT = 10;

const EventDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, participants, participantsPagination: pagination, loading } = useSelector((s) => s.events);
  const event = current?._id === id ? current : null;
  const listLoading = Boolean(loading["events/fetchParticipants"]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [callFor, setCallFor] = useState(null); // Call modal (naya call)
  const [logsFor, setLogsFor] = useState(null); // Logs modal (history)

  const loadEvent = useCallback(async () => {
    try {
      await dispatch(fetchEvent(id)).unwrap();
    } catch (message) {
      setNotFound(true);
      toast.error(message);
    }
  }, [dispatch, id]);

  const loadParticipants = useCallback(async () => {
    try {
      await dispatch(fetchParticipants({ id, page, limit: LIMIT, search, status })).unwrap();
    } catch (message) {
      toast.error(message);
    }
  }, [dispatch, id, page, search, status]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Call log / status change ke baad list aur counts dono refresh
  const refresh = () => {
    loadParticipants();
    loadEvent();
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const data = await dispatch(syncParticipants(id)).unwrap();
      toast.success(data.message);
      if (data.added) refresh();
    } catch (message) {
      toast.error(message);
    }
    setSyncing(false);
  };

  if (notFound) {
    return (
      <div className="bg-white rounded-2xl shadow p-8">
        <p className="text-gray-600">Event not found.</p>
        <Link to="/admin/events" className="text-royal-600 hover:underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  if (!event) return <div className="bg-white rounded-2xl shadow p-8 text-gray-500">Loading...</div>;

  const { counts } = event;
  const cards = [
    { label: "Total", value: counts.total, color: "text-royal-700" },
    { label: "Accepted", value: counts.ACCEPTED, color: "text-green-700" },
    { label: "Rejected", value: counts.REJECTED, color: "text-red-600" },
    { label: "Not Confirmed", value: counts.NOT_CONFIRMED, color: "text-yellow-700" },
  ];

  return (
    <div className="space-y-6">
      <Link to="/admin/events" className="text-sm text-royal-600 hover:underline">
        ← Back to events
      </Link>

      {/* Basic info */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {event.eventBanner && <img src={photoSrc(event.eventBanner)} alt="" className="w-full max-h-56 object-cover" />}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-royal-900">{event.eventName}</h2>
              <div className="mt-2">
                <Badge map={EVENT_STATUS} value={event.status} />
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="rounded-lg border border-royal-600 text-royal-700 hover:bg-royal-100 px-4 py-2 text-sm font-semibold">
              Edit Event
            </button>
          </div>

          <p className="mt-4 text-gray-700 whitespace-pre-line">{event.description}</p>

          <dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Venue</dt>
              <dd className="font-medium">{event.venue}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Starts</dt>
              <dd className="font-medium">{formatDateTime(event.startDateTime)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Ends</dt>
              <dd className="font-medium">{formatDateTime(event.endDateTime)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <h3 className="text-xl font-bold text-royal-900">Participants</h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name or mobile..." className={`${inputClass} sm:w-60`} />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={`${inputClass} sm:w-44`}
            >
              <option value="">All Status</option>
              {Object.entries(PARTICIPATION).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button onClick={sync} disabled={syncing} title="Event ke baad join hue members add karo" className="rounded-lg border border-gray-300 hover:bg-gray-50 px-4 py-2 text-sm font-medium whitespace-nowrap disabled:opacity-60">
              {syncing ? "Syncing..." : "Sync Members"}
            </button>
          </div>
        </div>

        <div className={`overflow-x-auto transition-opacity ${listLoading && participants.length ? "opacity-60" : ""}`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-royal-100 text-royal-900">
              <tr>
                <th className="px-4 py-3">SR No</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Calls</th>
                <th className="px-4 py-3">Last Call</th>
                <th className="px-4 py-3">Participation</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && participants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                    No participants found
                  </td>
                </tr>
              ) : (
                participants.map((p, i) => (
                  <tr key={p._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/members/${p.member._id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar member={p.member} />
                        <span className="font-medium">{fullName(p.member)}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{p.member.mobileNumber}</td>
                    <td className="px-4 py-3">{p.callCount}</td>
                    <td className="px-4 py-3">
                      {p.lastCalledAt ? (
                        <div className="space-y-1">
                          <Badge map={CALL_STATUS} value={p.lastCallStatus} />
                          <p className="text-xs text-gray-500">{formatDateTime(p.lastCalledAt)}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not called</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge map={PARTICIPATION} value={p.participationStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setCallFor(p)} className="rounded-lg bg-leaf hover:opacity-90 px-3 py-1.5 text-xs font-semibold text-white transition">
                          Call
                        </button>
                        <button onClick={() => setLogsFor(p)} className="rounded-lg border border-royal-600 text-royal-700 hover:bg-royal-100 px-3 py-1.5 text-xs font-semibold transition">
                          Logs
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
      </div>

      {editing && (
        <EventFormModal
          event={event}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            loadEvent();
          }}
        />
      )}
      {callFor && (
        <CallModal
          eventId={id}
          participant={callFor}
          onClose={() => setCallFor(null)}
          onSaved={() => {
            setCallFor(null);
            refresh();
          }}
        />
      )}
      {logsFor && <CallLogsModal eventId={id} participant={logsFor} onClose={() => setLogsFor(null)} />}
    </div>
  );
};

export default EventDetail;
