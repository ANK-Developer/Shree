import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginAdmin } from "../../features/auth/authSlice";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-royal-500";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginAdmin(form));
    if (loginAdmin.fulfilled.match(result)) {
      toast.success("Login successful");
      navigate("/admin/dashboard", { replace: true });
    } else {
      toast.error(result.payload);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-royal-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-royal-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">Shree Ji Admin Panel</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-royal-600 hover:bg-royal-700 disabled:opacity-60 text-white font-semibold py-2.5 transition"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
