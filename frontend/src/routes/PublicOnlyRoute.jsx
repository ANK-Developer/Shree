import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

// Login ho chuka admin /admin/login par aaye to dashboard bhej do
const PublicOnlyRoute = () => {
  const token = useSelector((s) => s.auth.token);
  return token ? <Navigate to="/admin/dashboard" replace /> : <Outlet />;
};

export default PublicOnlyRoute;
