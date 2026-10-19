import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { fetchMe } from "../features/auth/authSlice";

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const { token, user, checking } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token && !user) dispatch(fetchMe());
  }, [token, user, dispatch]);

  if (!token) return <Navigate to="/admin/login" replace />;
  if (checking || !user) {
    return <div className="min-h-screen grid place-items-center text-royal-700">Loading...</div>;
  }
  return <Outlet />;
};

export default ProtectedRoute;
