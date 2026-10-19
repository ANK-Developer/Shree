import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { createAdmin, fetchAdmins, updateAdminStatus } from "../../features/admins/adminsSlice";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-royal-500";
const emptyForm = { name: "", email: "", password: "" };

const CreateAdminModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const saving = useSelector((s) => s.admins.saving);
  const [form, setForm] = useState(emptyForm);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await dispatch(createAdmin(form)).unwrap();
      toast.success(res.message);
      onClose();
    } catch (message) {
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h3 className="text-xl font-bold text-royal-900">Create Admin</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-royal-600 hover:bg-royal-700 disabled:opacity-60 text-white font-semibold px-4 py-2"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Admins = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.admins);
  const currentUser = useSelector((s) => s.auth.user);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Typing ke 400ms baad search API call
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        await dispatch(fetchAdmins(search.trim())).unwrap();
      } catch (message) {
        toast.error(message);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search, dispatch]);

  const handleToggle = async (admin) => {
    try {
      const res = await dispatch(updateAdminStatus({ id: admin._id, isActive: !admin.isActive })).unwrap();
      toast.success(res.message);
    } catch (message) {
      toast.error(message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold text-royal-900">Admins</h2>
        <div className="flex gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="rounded-lg border border-gray-300 px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-royal-500"
          />
          <button
            onClick={() => setShowModal(true)}
            className="whitespace-nowrap rounded-lg bg-royal-600 hover:bg-royal-700 text-white font-semibold px-4 py-2 transition"
          >
            + Create Admin
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-royal-100 text-royal-900">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && list.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No admins found</td>
              </tr>
            ) : (
              list.map((admin, i) => {
                const isSelf = admin._id === currentUser?.id;
                return (
                  <tr key={admin._id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {admin.name}
                      {isSelf && <span className="ml-2 text-xs text-royal-600">(You)</span>}
                    </td>
                    <td className="px-4 py-3">{admin.email}</td>
                    <td className="px-4 py-3">{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          admin.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {admin.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(admin)}
                        disabled={isSelf && admin.isActive}
                        title={isSelf && admin.isActive ? "You cannot deactivate yourself" : ""}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          admin.isActive ? "bg-red-500 hover:bg-red-600" : "bg-leaf hover:opacity-90"
                        }`}
                      >
                        {admin.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && <CreateAdminModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Admins;
