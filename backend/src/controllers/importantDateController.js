const Member = require("../models/Member");
const escapeRegex = require("../utils/escapeRegex");

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUSES = ["ACTIVE", "INACTIVE"];
const EVENT_TYPES = ["BIRTHDAY", "ANNIVERSARY"];

// range -> aaj se kitne din ke andar (aaj = 0 din). "all" me koi limit nahi.
const RANGE_DAYS = { today: 0, next7: 7, next30: 30 };

// GET /api/important-dates?range=today|next7|next30|all&type=&status=&search=&page=&limit=
//
// Har member ke birthday aur anniversary ko alag-alag "event" ki tarah leta hai, har saal repeat hone wali
// agli date (nextDate) nikalta hai, aur aaj se din ka antar (daysUntil) ke hisaab se filter + sort karta hai.
// Dashboard aur Important Dates page dono isi query ko use karte hain.
// Filters already normalized hone chahiye (range valid key, type/status uppercase, search trimmed).
const queryImportantDates = async ({ page = 1, limit = 10, range = "all", type = "", status = "", search = "" }) => {
  // Dates DB me UTC midnight par store hain, isliye "aaj" bhi UTC midnight bana kar compare karte hain
  const now = new Date();
  const year = now.getFullYear();
  const today = new Date(Date.UTC(year, now.getMonth(), now.getDate()));

  const memberMatch = {};
  if (STATUSES.includes(status)) memberMatch.memberStatus = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    memberMatch.$or = [{ name: regex }, { mobileNumber: regex }];
  }

  const typeCond = EVENT_TYPES.includes(type) ? { $eq: ["$$e.type", type] } : true;

  const pipeline = [
    { $match: memberMatch },
    {
      $project: {
        photoUrl: 1,
        name: 1,
        surname: 1,
        mobileNumber: 1,
        memberType: 1,
        memberStatus: 1,
        events: {
          $filter: {
            input: [
              { type: "BIRTHDAY", date: "$birthDate" },
              { type: "ANNIVERSARY", date: "$anniversaryDate" },
            ],
            as: "e",
            // $gt null: sirf wahi events jinki date bhari hai (null/missing hat jate hain)
            cond: { $and: [{ $gt: ["$$e.date", null] }, typeCond] },
          },
        },
      },
    },
    { $unwind: "$events" },
    {
      $addFields: {
        eventType: "$events.type",
        eventDate: "$events.date",
        month: { $month: "$events.date" },
        day: { $dayOfMonth: "$events.date" },
      },
    },
    // Is saal ki date; wo nikal chuki ho to agle saal ki
    { $addFields: { thisYear: { $dateFromParts: { year, month: "$month", day: "$day" } } } },
    {
      $addFields: {
        nextDate: {
          $cond: [
            { $lt: ["$thisYear", today] },
            { $dateFromParts: { year: year + 1, month: "$month", day: "$day" } },
            "$thisYear",
          ],
        },
      },
    },
    {
      $addFields: {
        daysUntil: { $round: [{ $divide: [{ $subtract: ["$nextDate", today] }, DAY_MS] }, 0] },
        years: { $subtract: [{ $year: "$nextDate" }, { $year: "$eventDate" }] },
      },
    },
  ];

  if (range !== "all") pipeline.push({ $match: { daysUntil: { $lte: RANGE_DAYS[range] } } });

  pipeline.push(
    { $sort: { daysUntil: 1, name: 1, eventType: 1 } },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              memberId: "$_id",
              photoUrl: 1,
              name: 1,
              surname: 1,
              mobileNumber: 1,
              memberType: 1,
              memberStatus: 1,
              eventType: 1,
              nextDate: 1,
              daysUntil: 1,
              years: 1,
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  );

  const [{ rows, total }] = await Member.aggregate(pipeline);
  return { rows, count: total[0]?.n || 0 };
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
