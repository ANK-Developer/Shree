const { prisma } = require("../config/db");

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUSES = ["ACTIVE", "INACTIVE"];
const EVENT_TYPES = ["BIRTHDAY", "ANNIVERSARY"];

// range -> aaj se kitne din ke andar (aaj = 0 din). "all" me koi limit nahi.
const RANGE_DAYS = { today: 0, next7: 7, next30: 30 };

// Mongo jaisa binary string compare (sort order pehle jaisa rahe)
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// GET /api/important-dates?range=today|next7|next30|all&type=&status=&search=&page=&limit=
//
// Har member ke birthday aur anniversary ko alag-alag "event" ki tarah leta hai, har saal repeat hone wali
// agli date (nextDate) nikalta hai, aur aaj se din ka antar (daysUntil) ke hisaab se filter + sort karta hai.
// Dashboard aur Important Dates page dono isi query ko use karte hain.
// Filters already normalized hone chahiye (range valid key, type/status uppercase, search trimmed).
const queryImportantDates = async ({ page = 1, limit = 10, range = "all", type = "", status = "", search = "" }) => {
  // Dates DB me DATE (UTC midnight) hain, isliye "aaj" bhi UTC midnight bana kar compare karte hain
  const now = new Date();
  const year = now.getFullYear();
  const today = Date.UTC(year, now.getMonth(), now.getDate());

  const where = {};
  if (STATUSES.includes(status)) where.memberStatus = status;
  if (search) where.OR = [{ name: { contains: search } }, { mobileNumber: { contains: search } }];

  const members = await prisma.member.findMany({
    where,
    select: {
      id: true,
      photoUrl: true,
      name: true,
      surname: true,
      mobileNumber: true,
      memberType: true,
      memberStatus: true,
      birthDate: true,
      anniversaryDate: true,
    },
  });

  const rows = [];
  for (const { birthDate, anniversaryDate, id, ...member } of members) {
    const events = [
      { eventType: "BIRTHDAY", date: birthDate },
      { eventType: "ANNIVERSARY", date: anniversaryDate },
    ];

    for (const { eventType, date } of events) {
      // sirf wahi events jinki date bhari hai, aur type filter match kare
      if (!date || (EVENT_TYPES.includes(type) && eventType !== type)) continue;

      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      // Is saal ki date; wo nikal chuki ho to agle saal ki (29 Feb non-leap year me 1 Mar ban jata hai, pehle jaisa)
      let next = Date.UTC(year, month, day);
      if (next < today) next = Date.UTC(year + 1, month, day);

      const nextDate = new Date(next);
      const daysUntil = Math.round((next - today) / DAY_MS);
      if (range !== "all" && daysUntil > RANGE_DAYS[range]) continue;

      rows.push({
        memberId: id,
        ...member,
        eventType,
        nextDate,
        daysUntil,
        years: nextDate.getUTCFullYear() - date.getUTCFullYear(),
      });
    }
  }

  rows.sort((a, b) => a.daysUntil - b.daysUntil || cmp(a.name, b.name) || cmp(a.eventType, b.eventType));

  return { rows: rows.slice((page - 1) * limit, page * limit), count: rows.length };
};

const getImportantDates = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const range = Object.keys(RANGE_DAYS).includes(req.query.range) ? req.query.range : "all";
    const type = String(req.query.type || "").toUpperCase();
    const status = String(req.query.status || "").toUpperCase();
    const search = String(req.query.search || "").trim();

    const { rows, count } = await queryImportantDates({ page, limit, range, type, status, search });

    res.status(200).json({
      success: true,
      dates: rows,
      pagination: { page, limit, total: count, totalPages: Math.max(Math.ceil(count / limit), 1) },
    });
  } catch (error) {
    console.error("getImportantDates failed:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getImportantDates, queryImportantDates };
