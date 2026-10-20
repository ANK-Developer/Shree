import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchReferredMembers } from "../../features/members/membersSlice";
import { formatDate, fullName } from "../../utils/format";
import Avatar from "./Avatar";
import Pagination from "./Pagination";
import StatusBadge from "./StatusBadge";

const LIMIT = 10;

// Ye tab tabhi mount hota hai jab user click kare, isliye API call bhi tabhi hoti hai
const ReferredMembersTab = ({ memberId }) => {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.members.referred);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      await dispatch(fetchReferredMembers({ id: memberId, page, limit: LIMIT, search })).unwrap();
    } catch (message) {
      toast.error(message);
    }
  }, [dispatch, memberId, page, search]);

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

  return (
    <section className="bg-white rounded-2xl shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h3 className="text-lg font-bold text-royal-900">Members Referred</h3>
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search name or mobile..."
          className="rounded-lg border border-gray-300 px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-royal-500"
        />
      </div>

      <div className={`overflow-x-auto transition-opacity ${loading && list.length ? "opacity-60" : ""}`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-royal-100 text-royal-900">
            <tr>
              <th className="px-4 py-3">SR No</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-gray-500">Loading...</td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-10 text-center text-gray-500">
                  {search ? "No referred members match your search" : "This member has not referred anyone yet"}
                </td>
              </tr>
            ) : (
              list.map((r, i) => (
                <tr key={r._id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{(pagination.page - 1) * pagination.limit + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar member={r} />
                      <span className="font-medium">{fullName(r)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.mobileNumber}</td>
                  <td className="px-4 py-3">{r.memberType}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={r.memberStatus === "ACTIVE"} />
                  </td>
                  <td className="px-4 py-3">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/members/${r._id}`}
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
    </section>
  );
};

export default ReferredMembersTab;
