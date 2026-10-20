import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginAdmin } from "../../features/auth/authSlice";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent transition";

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V8a5 5 0 0110 0v3M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1z" />
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path strokeLinecap="round" d="M4 4l16 16" />}
  </svg>
);

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen grid place-items-center bg-linear-to-br from-royal-50 via-white to-royal-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-royal-100 overflow-hidden">
          <div className="h-2 bg-linear-to-r from-royal-600 via-gold-500 to-royal-600" />

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="text-center">
              <img
                src="/logo.jpeg"
                alt="श्री कृष्णा महारानी मण्डल"
                className="mx-auto h-24 w-24 rounded-full bg-white object-cover ring-4 ring-gold-500 shadow-md"
              />
              <h1 className="mt-4 text-2xl font-bold text-royal-900">Welcome Back</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to the Shree Ji Admin Panel</p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-royal-600"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-royal-600 hover:bg-royal-700 disabled:opacity-60 text-white font-semibold py-2.5 shadow-md transition"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© {new Date().getFullYear()} Shree Krishna Maharani Mandal</p>
      </div>
    </div>
  );
};

export default Login;
