import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Avatar from "../../components/admin/Avatar";
import Pagination from "../../components/admin/Pagination";
import StatusBadge from "../../components/admin/StatusBadge";
import { MembersIcon } from "../../components/admin/icons";
import { fetchMembers, fetchMemberStats } from "../../features/members/membersSlice";
import useMemberStatusToggle from "../../hooks/useMemberStatusToggle";
import { fullName } from "../../utils/format";

const MAX_LIMIT = 500;
const memberTypes = [
  "पैट्रन ट्रस्टी / Patron Trustee",
  "ट्रस्टी / Trustee",
  "रूम दान / Room Daan",
  "अध्यक्ष / President",
  "उपाध्यक्ष / Vice President",
  "सचिव / Secretary",
  "कोषाध्यक्ष / Treasurer",
  "सदस्य / Member",
  "संस्थापक सदस्य / Founder Member",
  "कार्यकारी सदस्य / Executive Member",
  "सलाहकार / Advisor",
  "मानद सदस्य / Honorary Member",
  "स्वयंसेवक / Volunteer",
  "अन्य / Other",
];
const inputClass = "rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-royal-500";

const Members = () => {
  const dispatch = useDispatch();
  const { list, pagination, loading, stats, statsLoaded } = useSelector((s) => s.members);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = ["ACTIVE", "INACTIVE"].includes(searchParams.get("status")) ? searchParams.get("status") : "";

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(statusFromUrl);
  const [type, setType] = useState("");
  const [limitInput, setLimitInput] = useState("10");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      await dispatch(fetchMembers({ page, limit, search, status, type })).unwrap();
    } catch (message) {
      toast.error(message);
    }
  }, [dispatch, page, limit, search, status, type]);

  const loadStats = useCallback(() => {
    dispatch(fetchMemberStats())
      .unwrap()
      .catch((message) => toast.error(message));
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    setStatus(statusFromUrl);
    setPage(1);
  }, [statusFromUrl]);

  // Typing ke 400ms baad hi search hota hai, aur search badalne par page 1 par aate hain
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Status badalne par list aur cards dono refresh
  const { requestToggle, modal } = useMemberStatusToggle(() => {
    load();
    loadStats();
  });

  const cards = [
    { label: "Total Members", value: stats.total, color: "text-royal-700 bg-royal-100" },
    { label: "Active Members", value: stats.active, color: "text-green-700 bg-green-100" },
    { label: "Inactive Members", value: stats.inactive, color: "text-red-700 bg-red-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-3xl font-bold text-royal-900 mt-1">{statsLoaded ? c.value : "–"}</p>
            </div>
            <span className={`h-12 w-12 rounded-full grid place-items-center ${c.color}`}>
              <MembersIcon className="w-6 h-6" />
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
          <h2 className="text-2xl font-bold text-royal-900">Members</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name or mobile..." className={`${inputClass} w-full sm:w-64`} />
            <select
              value={status}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setSearchParams(nextStatus ? { status: nextStatus } : {});
              }}
              className={inputClass}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All Types</option>
              {memberTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max={MAX_LIMIT}
              value={limitInput}
              onChange={(e) => {
                setLimitInput(e.target.value);
                const n = Math.min(parseInt(e.target.value, 10), MAX_LIMIT);
                if (n >= 1) {
                  setLimit(n);
                  setPage(1);
                }
              }}
              onBlur={() => setLimitInput(String(limit))}
              title="Members per page"
              placeholder="Rows"
              className={`${inputClass} w-24`}
            />
            <Link to="/admin/members/new" className="rounded-xl bg-royal-600 hover:bg-royal-700 px-4 py-2.5 text-center text-sm font-semibold text-white whitespace-nowrap transition">
              + Add Member
            </Link>
          </div>
        </div>

        <div className={`overflow-x-auto transition-opacity ${loading && list.length ? "opacity-60" : ""}`}>
          <table className="w-full text-left text-sm">
            <thead className="bg-royal-100 text-royal-900">
              <tr>
                <th className="px-4 py-3">SR No</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && list.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              ) : (
                list.map((m, i) => {
                  const active = m.memberStatus === "ACTIVE";
                  return (
                    <tr key={m._id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar member={m} />
                          <span className="font-medium">{fullName(m)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{m.mobileNumber}</td>
                      <td className="px-4 py-3">
                        <StatusBadge active={active} />
                      </td>
                      <td className="px-4 py-3">{m.memberType}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/admin/members/${m._id}`} className="rounded-lg bg-royal-600 hover:bg-royal-700 px-3 py-1.5 text-xs font-semibold text-white transition">
                            View
                          </Link>
                          <Link to={`/admin/members/${m._id}/edit`} className="rounded-lg bg-gold-500 hover:bg-gold-600 px-3 py-1.5 text-xs font-semibold text-royal-900 transition">
                            Edit
                          </Link>
                          <button onClick={() => requestToggle(m)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${active ? "bg-red-500 hover:bg-red-600" : "bg-leaf hover:opacity-90"}`}>
                            {active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination {...pagination} onChange={setPage} />
        {modal}
      </div>
    </div>
  );
};

export default Members;
