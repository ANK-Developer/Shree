const Member = require("../models/Member");
const Event = require("../models/Event");
const { queryImportantDates } = require("./importantDateController");
const { participantCounts } = require("./eventController");

const LIST_SIZE = 5;

// Member counts: { total, active, inactive }
const getMemberStats = async () => {
  const counts = await Member.aggregate([{ $group: { _id: "$memberStatus", count: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const active = byStatus.ACTIVE || 0;
  const inactive = byStatus.INACTIVE || 0;
  return { total: active + inactive, active, inactive };
};

// Sabse nazdeek ke UPCOMING events (jo abhi khatam nahi hue), participant counts ke saath
const getUpcomingEvents = async () => {
  const events = await Event.find({ status: "UPCOMING", endDateTime: { $gte: new Date() } })
    .sort({ startDateTime: 1 })
    .limit(LIST_SIZE)
    .select("eventName venue startDateTime endDateTime status")
    .lean();

  const counts = await participantCounts(events.map((e) => e._id));
  return events.map((e) => ({ ...e, counts: counts.get(String(e._id)) }));
};

// GET /api/dashboard  ->  { stats, upcomingEvents (max 5), importantDates (max 5) }
const getDashboard = async (req, res) => {
  try {
    const [stats, upcomingEvents, important] = await Promise.all([
      getMemberStats(),
      getUpcomingEvents(),
      // range "all": aaj se aage ki nazdeeki dates, daysUntil ke hisaab se sorted
      queryImportantDates({ page: 1, limit: LIST_SIZE, range: "all" }),
    ]);

    res.status(200).json({ success: true, stats, upcomingEvents, importantDates: important.rows });
  } catch (error) {
    console.error("getDashboard failed:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getDashboard };
