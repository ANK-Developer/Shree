const { prisma } = require("../config/db");
const { toApi } = require("../utils/toApi");
const { queryImportantDates } = require("./importantDateController");
const { participantCounts } = require("./eventController");
const { memberStats } = require("./memberController");

const LIST_SIZE = 5;

// Sabse nazdeek ke UPCOMING events (jo abhi khatam nahi hue), participant counts ke saath
const getUpcomingEvents = async () => {
  const events = await prisma.event.findMany({
    where: { status: "UPCOMING", endDateTime: { gte: new Date() } },
    orderBy: { startDateTime: "asc" },
    take: LIST_SIZE,
    select: { id: true, eventName: true, venue: true, startDateTime: true, endDateTime: true, status: true },
  });

  const counts = await participantCounts(events.map((e) => e.id));
  return events.map((e) => ({ ...e, counts: counts.get(e.id) }));
};

// GET /api/dashboard  ->  { stats, upcomingEvents (max 5), importantDates (max 5) }
const getDashboard = async (req, res) => {
  try {
    const [stats, upcomingEvents, important] = await Promise.all([
      memberStats(),
      getUpcomingEvents(),
      // range "all": aaj se aage ki nazdeeki dates, daysUntil ke hisaab se sorted
      queryImportantDates({ page: 1, limit: LIST_SIZE, range: "all" }),
    ]);

    res.status(200).json({ success: true, stats, upcomingEvents: toApi(upcomingEvents), importantDates: important.rows });
  } catch (error) {
    console.error("getDashboard failed:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getDashboard };
