import { NavLink } from "react-router-dom";
import { AdminIcon, CalendarIcon, DashboardIcon, EventsIcon, MembersIcon } from "./icons";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/admin/important-dates", label: "Important Dates", icon: CalendarIcon },
  { to: "/admin/members", label: "Members", icon: MembersIcon },
  { to: "/admin/events", label: "Events", icon: EventsIcon },
  { to: "/admin/admins", label: "Admin", icon: AdminIcon },
];

// Mobile: screen par fixed drawer (open/close slide). Desktop (md+): page scroll par bhi sticky rehta hai, open=w-64 / closed=w-16
const Sidebar = ({ open, onNavigate }) => (
  <aside
    className={`fixed inset-y-0 left-0 z-40 w-64 bg-royal-900 text-white transition-all duration-300 ${
      open ? "translate-x-0" : "-translate-x-full"
    } md:sticky md:top-0 md:h-screen md:shrink-0 md:self-start md:translate-x-0 ${open ? "md:w-64" : "md:w-16"}`}
  >
    <div className="h-16 flex items-center justify-center gap-3 border-b border-white/10 font-bold text-lg">
      <img src="/logo.jpeg" alt="Logo" className="h-10 w-10 rounded-full bg-white object-cover ring-2 ring-gold-500" />
      {open && <span className="whitespace-nowrap">Shree Ji Admin</span>}
    </div>

    <nav className="p-2 space-y-1">
      {links.map(({ to, label, icon: IconComp }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition ${
              open ? "" : "justify-center"
            } ${isActive ? "bg-gold-500 text-royal-900 font-semibold" : "hover:bg-white/10"}`
          }
        >
          <IconComp className="w-6 h-6 shrink-0" />
          {open && <span className="whitespace-nowrap">{label}</span>}

          {/* Collapsed hone par hover pe label dikhta hai */}
          {!open && (
            <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
