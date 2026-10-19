import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import { LogoutIcon, MenuIcon } from "../components/admin/icons";
import { logout } from "../features/auth/authSlice";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [open, setOpen] = useState(true);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-royal-50">
      <Sidebar open={open} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white shadow-sm px-4 flex items-center justify-between">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle sidebar"
            className="p-2 rounded-lg text-royal-900 hover:bg-royal-100 transition"
          >
            <MenuIcon />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-royal-900 font-semibold px-3 py-1.5 transition"
            >
              <LogoutIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
