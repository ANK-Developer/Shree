import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Avatar from "../../components/admin/Avatar";
import Pagination from "../../components/admin/Pagination";
import StatusBadge from "../../components/admin/StatusBadge";
import { fetchImportantDates } from "../../features/importantDates/importantDatesSlice";
import { formatDateOnly, fullName } from "../../utils/format";

const LIMIT = 10;
const RANGES = [
  { value: "today", label: "Today" },
  { value: "next7", label: "Next 7 Days" },
  { value: "next30", label: "Next 30 Days" },
  { value: "all", label: "All" },
];
const inputClass =
  "rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-royal-500";

const whenLabel = (days) => (days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`);

const EventBadge = ({ type }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
      type === "BIRTHDAY" ? "bg-pink-100 text-pink-700" : "bg-amber-100 text-amber-700"
    }`}
  >
    {type === "BIRTHDAY" ? "🎂 Birthday" : "💍 Anniversary"}
  </span>
);

const ImportantDates = () => {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.importantDates);

  const [range, setRange] = useState("today"); // default: aaj
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      await dispatch(fetchImportantDates({ range, type, status, search, page, limit: LIMIT })).unwrap();
    } catch (message) {
      toast.error(message);
    }
  }, [dispatch, range, type, status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Typing ke 400ms baad search, aur search badalne par page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Koi bhi filter badalne par page 1 par wapas
  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const emptyText = search
    ? "No results match your search"
    : range === "today"
      ? "No birthdays or anniversaries today"
      : "No important dates found";

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex flex-col gap-4 mb-5">
        <h2 className="text-2xl font-bold text-royal-900">Important Dates</h2>

        {/* Range tabs */}
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => changeFilter(setRange)(r.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                range === r.value ? "bg-royal-600 text-white" : "bg-royal-100 text-royal-700 hover:bg-royal-500/20"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Search + dropdown filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or mobile..."
            className={`${inputClass} w-full sm:w-64`}
          />
          <select value={type} onChange={(e) => changeFilter(setType)(e.target.value)} className={inputClass}>
            <option value="">Birthday + Anniversary</option>
            <option value="BIRTHDAY">Birthday</option>
            <option value="ANNIVERSARY">Anniversary</option>
          </select>
          <select value={status} onChange={(e) => changeFilter(setStatus)(e.target.value)} className={inputClass}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className={`overflow-x-auto transition-opacity ${loading && list.length ? "opacity-60" : ""}`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-royal-100 text-royal-900">
            <tr>
              <th className="px-4 py-3">SR No</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Years</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-gray-500">Loading...</td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-10 text-center text-gray-500">{emptyText}</td>
              </tr>
            ) : (
              list.map((d, i) => (
                <tr key={`${d.memberId}-${d.eventType}`} className="border-t border-gray-100">
                  <td className="px-4 py-3">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar member={d} />
                      <span className="font-medium">{fullName(d)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{d.mobileNumber}</td>
                  <td className="px-4 py-3">
                    <EventBadge type={d.eventType} />
                  </td>
                  <td className="px-4 py-3">
                    <p>{formatDateOnly(d.nextDate)}</p>
                    <p className={`text-xs ${d.daysUntil === 0 ? "font-semibold text-leaf" : "text-gray-400"}`}>
                      {whenLabel(d.daysUntil)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {d.years > 0 ? (d.eventType === "BIRTHDAY" ? `Turns ${d.years}` : `${d.years} yrs`) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={d.memberStatus === "ACTIVE"} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/members/${d.memberId}`}
                      className="rounded-lg bg-royal-600 hover:bg-royal-700 px-3 py-1.5 text-xs font-semibold text-white transition"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination {...pagination} onChange={setPage} />
    </div>
  );
};

export default ImportantDates;
