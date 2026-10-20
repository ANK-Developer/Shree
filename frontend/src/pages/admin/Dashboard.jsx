import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Avatar from "../../components/admin/Avatar";
import { MembersIcon } from "../../components/admin/icons";
import { formatDateTime } from "../../components/admin/eventUi";
import { fetchDashboard } from "../../features/dashboard/dashboardSlice";
import { formatDateOnly, fullName } from "../../utils/format";

const whenLabel = (days) => (days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`);

const TypeBadge = ({ type }) => (
  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${type === "BIRTHDAY" ? "bg-pink-100 text-pink-700" : "bg-amber-100 text-amber-700"}`}>{type === "BIRTHDAY" ? "🎂 Birthday" : "💍 Anniversary"}</span>
);

// Dono lists ka common card: title + "View all" link + body
const Section = ({ title, to, children }) => (
  <div className="bg-white rounded-2xl shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-royal-900">{title}</h3>
      <Link to={to} className="text-sm font-semibold text-royal-600 hover:underline">
        View all →
      </Link>
    </div>
    {children}
  </div>
);

const Empty = ({ loaded, text }) => <p className="py-8 text-center text-gray-500">{loaded ? text : "Loading..."}</p>;

const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { stats, upcomingEvents, importantDates, loaded } = useSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard())
      .unwrap()
      .catch((message) => toast.error(message));
  }, [dispatch]);

  const cards = [
    { label: "Total Members", value: stats.total, color: "text-royal-700 bg-royal-100" },
    { label: "Active Members", value: stats.active, color: "text-green-700 bg-green-100" },
    { label: "Inactive Members", value: stats.inactive, color: "text-red-700 bg-red-100" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-royal-900">Welcome, {user?.name}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-3xl font-bold text-royal-900 mt-1">{loaded ? c.value : "–"}</p>
            </div>
            <span className={`h-12 w-12 rounded-full grid place-items-center ${c.color}`}>
              <MembersIcon className="w-6 h-6" />
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section title="Upcoming Events" to="/admin/events">
          {upcomingEvents.length === 0 ? (
            <Empty loaded={loaded} text="No upcoming events" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingEvents.map((e) => (
                <li key={e._id}>
                  <Link to={`/admin/events/${e._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{e.eventName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatDateTime(e.startDateTime)} · {e.venue}
                      </p>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <p className="font-semibold text-royal-900">{e.counts.total} members</p>
                      <p className="text-green-700">{e.counts.ACCEPTED} accepted</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Important Dates" to="/admin/important-dates">
          {importantDates.length === 0 ? (
            <Empty loaded={loaded} text="No important dates" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {importantDates.map((d) => (
                <li key={`${d.memberId}-${d.eventType}`}>
                  <Link to={`/admin/members/${d.memberId}`} className="flex items-center justify-between gap-3 py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar member={d} />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{fullName(d)}</p>
                        <TypeBadge type={d.eventType} />
                      </div>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <p className="font-semibold text-royal-900">{formatDateOnly(d.nextDate)}</p>
                      <p className={d.daysUntil === 0 ? "font-semibold text-leaf" : "text-gray-400"}>{whenLabel(d.daysUntil)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
};

export default Dashboard;
