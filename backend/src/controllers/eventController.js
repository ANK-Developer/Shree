const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventParticipant = require("../models/EventParticipant");
const EventCall = require("../models/EventCall");
const Member = require("../models/Member");
const escapeRegex = require("../utils/escapeRegex");
const { BANNER_URL_PREFIX, removeUploadedFile } = require("../middleware/upload");

const EVENT_STATUSES = Event.schema.path("status").enumValues;
const PARTICIPATION_STATUSES = EventParticipant.schema.path("participationStatus").enumValues;
const CALL_STATUSES = EventCall.schema.path("callStatus").enumValues;

// eventBanner yahan nahi: wo text field nahi, uploaded file se aata hai
const EVENT_FIELDS = ["eventName", "description", "status", "venue", "startDateTime", "endDateTime"];

const isValidId = (id) => mongoose.isValidObjectId(id);

const pageParams = (query, defaultLimit = 10) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 50),
});

const paginate = (page, limit, total) => ({ page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });

const pick = (body) => {
  const data = {};
  EVENT_FIELDS.forEach((key) => {
    if (body[key] !== undefined) data[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
  });
  return data;
};

const handleError = (res, error, label) => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid value" });
  }
  console.error(`${label} failed:`, error.message);
  res.status(500).json({ success: false, message: "Server error" });
};

// Event ke participant counts: { total, ACCEPTED, REJECTED, NOT_CONFIRMED }
const participantCounts = async (eventIds) => {
  const rows = await EventParticipant.aggregate([
    { $match: { eventId: { $in: eventIds } } },
    { $group: { _id: { eventId: "$eventId", status: "$participationStatus" }, n: { $sum: 1 } } },
  ]);

  const map = new Map();
  eventIds.forEach((id) => map.set(String(id), { total: 0, ACCEPTED: 0, REJECTED: 0, NOT_CONFIRMED: 0 }));
  rows.forEach(({ _id, n }) => {
    const entry = map.get(String(_id.eventId));
    entry[_id.status] = n;
    entry.total += n;
  });
  return map;
};

// Jo ACTIVE members is event me abhi tak nahi hain unko add karta hai. Unique index (eventId+memberId) ki wajah se
// parallel/repeat call par bhi duplicate nahi banta (ordered:false => duplicates skip, baaki insert).
const addMissingParticipants = async (eventId) => {
  const existing = await EventParticipant.distinct("memberId", { eventId });
  const members = await Member.find({ memberStatus: "ACTIVE", _id: { $nin: existing } }).select("_id").lean();
  if (members.length === 0) return 0;

  try {
    const inserted = await EventParticipant.insertMany(
      members.map((m) => ({ eventId, memberId: m._id })),
      { ordered: false },
    );
    return inserted.length;
  } catch (error) {
    if (error.code === 11000 || error.writeErrors) return error.insertedDocs?.length || 0;
    throw error;
  }
};

// POST /api/events
const createEvent = async (req, res) => {
  try {
    const eventBanner = req.file ? `${BANNER_URL_PREFIX}/${req.file.filename}` : null;
    const event = await Event.create({ ...pick(req.body), eventBanner, createdBy: req.user._id });
    const participants = await addMissingParticipants(event._id);

    res.status(201).json({ success: true, message: "Event created successfully", event, participants });
  } catch (error) {
    if (req.file) removeUploadedFile(`${BANNER_URL_PREFIX}/${req.file.filename}`); // fail hui to orphan file na rahe
    handleError(res, error, "createEvent");
  }
};

// GET /api/events?status=&search=&page=&limit=
const getEvents = async (req, res) => {
  try {
    const { page, limit } = pageParams(req.query);
    const status = String(req.query.status || "").toUpperCase();
    const search = String(req.query.search || "").trim();

    const filter = {};
    if (EVENT_STATUSES.includes(status)) filter.status = status;
    if (search) filter.eventName = new RegExp(escapeRegex(search), "i");

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ startDateTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    const counts = await participantCounts(events.map((e) => e._id));
    const list = events.map((e) => ({ ...e, counts: counts.get(String(e._id)) }));

    res.status(200).json({ success: true, events: list, pagination: paginate(page, limit, total) });
  } catch (error) {
    handleError(res, error, "getEvents");
  }
};

// GET /api/events/:id  -> event + participant counts
const getEventById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Event not found" });

    const event = await Event.findById(req.params.id).populate("createdBy", "name").lean();
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const counts = await participantCounts([event._id]);
    res.status(200).json({ success: true, event: { ...event, counts: counts.get(String(event._id)) } });
  } catch (error) {
    handleError(res, error, "getEventById");
  }
};

// PUT /api/events/:id  (multipart: fields + optional eventBanner file; removeBanner=true se banner hatta sakte hain)
const updateEvent = async (req, res) => {
  const newBanner = req.file ? `${BANNER_URL_PREFIX}/${req.file.filename}` : null;
  try {
    const event = isValidId(req.params.id) ? await Event.findById(req.params.id) : null;
    if (!event) {
      removeUploadedFile(newBanner);
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const oldBanner = event.eventBanner;
    // set + save() => validators (endDateTime > startDateTime) document context ke saath chalte hain
    event.set(pick(req.body));
    if (newBanner) event.eventBanner = newBanner;
    else if (req.body.removeBanner === "true") event.eventBanner = null;
    await event.save();

    // Purani file tabhi hatate hain jab DB update successful ho chuka ho
    if (oldBanner && oldBanner !== event.eventBanner) removeUploadedFile(oldBanner);

    res.status(200).json({ success: true, message: "Event updated successfully", event });
  } catch (error) {
    removeUploadedFile(newBanner);
    handleError(res, error, "updateEvent");
  }
};

// PATCH /api/events/:id/status  { status }
const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!EVENT_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid event status" });
    }

    const event = isValidId(req.params.id) ? await Event.findByIdAndUpdate(req.params.id, { status }, { new: true }) : null;
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    res.status(200).json({ success: true, message: "Event status updated", event });
  } catch (error) {
    handleError(res, error, "updateEventStatus");
  }
};

// DELETE /api/events/:id  (participants aur unke call logs bhi hat jate hain)
const deleteEvent = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Event not found" });

    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    removeUploadedFile(event.eventBanner);
    const ids = await EventParticipant.distinct("_id", { eventId: event._id });
    await Promise.all([EventCall.deleteMany({ eventParticipantId: { $in: ids } }), EventParticipant.deleteMany({ eventId: event._id })]);

    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    handleError(res, error, "deleteEvent");
  }
};

// POST /api/events/:id/sync-participants  (event ke baad join hue ACTIVE members ko add karta hai)
const syncParticipants = async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !(await Event.exists({ _id: req.params.id }))) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    const added = await addMissingParticipants(req.params.id);
    res.status(200).json({ success: true, message: added ? `${added} new member(s) added` : "Already up to date", added });
  } catch (error) {
    handleError(res, error, "syncParticipants");
  }
};

// GET /api/events/:id/participants?status=&search=&page=&limit=
const getParticipants = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Event not found" });

    const { page, limit } = pageParams(req.query);
    const status = String(req.query.status || "").toUpperCase();
    const search = String(req.query.search || "").trim();
    const eventId = new mongoose.Types.ObjectId(req.params.id);

    const match = { eventId };
    if (PARTICIPATION_STATUSES.includes(status)) match.participationStatus = status;

    const pipeline = [
      { $match: match },
      { $lookup: { from: Member.collection.name, localField: "memberId", foreignField: "_id", as: "member" } },
      { $unwind: "$member" },
    ];

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      pipeline.push({ $match: { $or: [{ "member.name": regex }, { "member.surname": regex }, { "member.mobileNumber": regex }] } });
    }

    pipeline.push(
      { $sort: { "member.name": 1, _id: 1 } },
      {
        $facet: {
          rows: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                participationStatus: 1,
                callCount: 1,
                lastCalledAt: 1,
                lastCallStatus: 1,
                member: {
                  _id: 1,
                  photoUrl: 1,
                  name: 1,
                  surname: 1,
                  mobileNumber: 1,
                  memberType: 1,
                  memberStatus: 1,
                },
              },
            },
          ],
          total: [{ $count: "n" }],
        },
      },
    );

    const [{ rows, total }] = await EventParticipant.aggregate(pipeline);
    res.status(200).json({ success: true, participants: rows, pagination: paginate(page, limit, total[0]?.n || 0) });
  } catch (error) {
    handleError(res, error, "getParticipants");
  }
};

// Participant us event ka hi hai ya nahi (URL tampering se doosre event ka participant na chhua jaye)
const findParticipant = (eventId, participantId) =>
  isValidId(eventId) && isValidId(participantId) ? EventParticipant.findOne({ _id: participantId, eventId }) : null;

// PATCH /api/events/:id/participants/:participantId  { participationStatus }
const updateParticipantStatus = async (req, res) => {
  try {
    const { participationStatus } = req.body;
    if (!PARTICIPATION_STATUSES.includes(participationStatus)) {
      return res.status(400).json({ success: false, message: "Invalid participation status" });
    }

    const participant = await findParticipant(req.params.id, req.params.participantId);
    if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

    participant.participationStatus = participationStatus;
    await participant.save();

    res.status(200).json({ success: true, message: "Participation status updated", participant });
  } catch (error) {
    handleError(res, error, "updateParticipantStatus");
  }
};

// POST /api/events/:id/participants/:participantId/calls  { callStatus, callResponse, participationStatus?, calledAt? }
// Ek hi request me call log + (optional) participation status update
const addCall = async (req, res) => {
  try {
    const { callStatus, callResponse, participationStatus, calledAt } = req.body;

    if (!CALL_STATUSES.includes(callStatus)) {
      return res.status(400).json({ success: false, message: "Invalid call status" });
    }
    if (participationStatus && !PARTICIPATION_STATUSES.includes(participationStatus)) {
      return res.status(400).json({ success: false, message: "Invalid participation status" });
    }

    let calledAtDate = new Date();
    if (calledAt) {
      calledAtDate = new Date(calledAt);
      if (Number.isNaN(calledAtDate.getTime()) || calledAtDate > new Date(Date.now() + 60 * 1000)) {
        return res.status(400).json({ success: false, message: "Call time cannot be in the future" });
      }
    }

    const participant = await findParticipant(req.params.id, req.params.participantId);
    if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

    const call = await EventCall.create({
      eventParticipantId: participant._id,
      callStatus,
      callResponse: typeof callResponse === "string" && callResponse.trim() ? callResponse.trim() : null,
      calledAt: calledAtDate,
      calledBy: req.user._id,
    });

    // Summary fields atomically update; lastCalledAt sirf tab badalta hai jab ye call sabse naya ho (purani call backfill ho sakti hai)
    const latest = await EventCall.findOne({ eventParticipantId: participant._id }).sort({ calledAt: -1, _id: -1 }).lean();
    const update = {
      $inc: { callCount: 1 },
      $set: { lastCalledAt: latest.calledAt, lastCallStatus: latest.callStatus },
    };
    if (participationStatus) update.$set.participationStatus = participationStatus;

    const updated = await EventParticipant.findByIdAndUpdate(participant._id, update, { new: true });

    res.status(201).json({ success: true, message: "Call logged successfully", call, participant: updated });
  } catch (error) {
    handleError(res, error, "addCall");
  }
};

// GET /api/events/:id/participants/:participantId/calls  -> poori call history (latest first)
const getCalls = async (req, res) => {
  try {
    const participant = await findParticipant(req.params.id, req.params.participantId);
    if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

    const calls = await EventCall.find({ eventParticipantId: participant._id })
      .sort({ calledAt: -1, _id: -1 })
      .populate("calledBy", "name")
      .lean();

    res.status(200).json({ success: true, calls, participant });
  } catch (error) {
    handleError(res, error, "getCalls");
  }
};

module.exports = {
  participantCounts,
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  syncParticipants,
  getParticipants,
  updateParticipantStatus,
  addCall,
  getCalls,
};
