import { Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import MembershipForm from "../pages/Form";
import Login from "../pages/admin/Login";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import ImportantDates from "../pages/admin/ImportantDates";
import Members from "../pages/admin/Members";
import MemberProfile from "../pages/admin/MemberProfile";
import Events from "../pages/admin/Events";
import EventDetail from "../pages/admin/EventDetail";
import Admins from "../pages/admin/Admins";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

const AppRoutes = () => (
  <Routes>
    {/* Public website */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<MembershipForm />} />
    </Route>

    {/* Admin panel */}
    <Route element={<PublicOnlyRoute />}>
      <Route path="/admin/login" element={<Login />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/important-dates" element={<ImportantDates />} />
        <Route path="/admin/members" element={<Members />} />
        <Route path="/admin/members/:id" element={<MemberProfile />} />
        <Route path="/admin/events" element={<Events />} />
        <Route path="/admin/events/:id" element={<EventDetail />} />
        <Route path="/admin/admins" element={<Admins />} />
      </Route>
    </Route>
    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
