const StatusBadge = ({ active }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
      active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

export default StatusBadge;
