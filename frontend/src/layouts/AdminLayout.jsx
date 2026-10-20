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
  // Desktop par khula, mobile par band shuru hota hai
  const [open, setOpen] = useState(() => window.matchMedia("(min-width: 768px)").matches);

  // Mobile drawer me link dabane par drawer band ho jata hai (desktop par sidebar as-is rehta hai)
  const closeOnMobile = () => {
    if (!window.matchMedia("(min-width: 768px)").matches) setOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-royal-50">
      <Sidebar open={open} onNavigate={closeOnMobile} />

      {/* Mobile: drawer ke peeche dim backdrop, uspar tap karne se band */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

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
