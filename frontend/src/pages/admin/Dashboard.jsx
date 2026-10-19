import { useSelector } from "react-redux";

const Dashboard = () => {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="bg-white rounded-2xl shadow p-8 text-center">
      <h2 className="text-2xl font-bold text-royal-900">Welcome to Dashboard</h2>
      <p className="text-gray-500 mt-2">Hello, {user?.name}</p>
    </div>
  );
};

export default Dashboard;
