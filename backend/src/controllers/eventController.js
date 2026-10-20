const { prisma } = require("../config/db");
const { toApi, isValidId } = require("../utils/toApi");
const { BANNER_URL_PREFIX, removeUploadedFile } = require("../middleware/upload");

const EVENT_STATUSES = ["UPCOMING", "LIVE", "COMPLETED", "CANCELLED"];
const PARTICIPATION_STATUSES = ["ACCEPTED", "REJECTED", "NOT_CONFIRMED"];
const CALL_STATUSES = ["PENDING", "ANSWERED", "NOT_ANSWERED", "BUSY", "FAILED"];

// eventBanner yahan nahi: wo text field nahi, uploaded file se aata hai
const EVENT_FIELDS = ["eventName", "description", "status", "venue", "startDateTime", "endDateTime"];

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

// Pehle Mongoose schema ye rules check karta tha. data = poora event (create: picked fields, update: purana + naya)
// return: { errors, data } jisme dates Date object ban chuki hoti hain
const validateEvent = (input) => {
  const errors = [];
  const data = { ...input, status: input.status || "UPCOMING" };

  const text = (key, label, max) => {
    data[key] = String(data[key] ?? "").trim();
    if (!data[key]) errors.push(`${label} is required`);
    else if (data[key].length > max) errors.push(`${label} must be at most ${max} characters`);
  };
  const date = (key, label) => {
    if (!data[key]) return errors.push(`${label} is required`);
    const d = data[key] instanceof Date ? data[key] : new Date(data[key]);
    if (Number.isNaN(d.getTime())) return errors.push(`${label} is invalid`);
    data[key] = d;
  };

  text("eventName", "Event name", 150);
  text("description", "Description", 5000);
  text("venue", "Venue", 300);
  if (!EVENT_STATUSES.includes(data.status)) errors.push("Invalid event status");
  date("startDateTime", "Start date and time");
  date("endDateTime", "End date and time");

  if (data.startDateTime instanceof Date && data.endDateTime instanceof Date && data.endDateTime <= data.startDateTime) {
    errors.push("End date and time must be after start date and time");
  }
  return { errors, data };
};

const handleError = (res, error, label) => {
  console.error(`${label} failed:`, error.message);
  res.status(500).json({ success: false, message: "Server error" });
};

// Event ke participant counts: { total, ACCEPTED, REJECTED, NOT_CONFIRMED }
const participantCounts = async (eventIds) => {
  const map = new Map();
  eventIds.forEach((id) => map.set(id, { total: 0, ACCEPTED: 0, REJECTED: 0, NOT_CONFIRMED: 0 }));
  if (eventIds.length === 0) return map;

  const rows = await prisma.eventParticipant.groupBy({
    by: ["eventId", "participationStatus"],
    where: { eventId: { in: eventIds } },
    _count: { _all: true },
  });

  rows.forEach(({ eventId, participationStatus, _count }) => {
    const entry = map.get(eventId);
    entry[participationStatus] = _count._all;
    entry.total += _count._all;
  });
  return map;
};

// Jo ACTIVE members is event me abhi tak nahi hain unko add karta hai. Unique key (eventId+memberId) + skipDuplicates
// ki wajah se parallel/repeat call par bhi duplicate nahi banta.
const addMissingParticipants = async (eventId) => {
  const members = await prisma.member.findMany({
    where: { memberStatus: "ACTIVE", participations: { none: { eventId } } },
    select: { id: true },
  });
  if (members.length === 0) return 0;

  const { count } = await prisma.eventParticipant.createMany({
    data: members.map((m) => ({ eventId, memberId: m.id })),
    skipDuplicates: true,
  });
  return count;
};

// POST /api/events
const createEvent = async (req, res) => {
  const eventBanner = req.file ? `${BANNER_URL_PREFIX}/${req.file.filename}` : null;
  try {
    const { errors, data } = validateEvent(pick(req.body));
    if (errors.length) {
      removeUploadedFile(eventBanner); // fail hui to orphan file na rahe
      return res.status(400).json({ success: false, message: errors.join(", ") });
    }

    const event = await prisma.event.create({ data: { ...data, eventBanner, createdBy: req.user.id } });
    const participants = await addMissingParticipants(event.id);

    res.status(201).json({ success: true, message: "Event created successfully", event: toApi(event), participants });
  } catch (error) {
    removeUploadedFile(eventBanner);
    handleError(res, error, "createEvent");
  }
};

// GET /api/events?status=&search=&page=&limit=
const getEvents = async (req, res) => {
  try {
    const { page, limit } = pageParams(req.query);
    const status = String(req.query.status || "").toUpperCase();
    const search = String(req.query.search || "").trim();

    const where = {};
    if (EVENT_STATUSES.includes(status)) where.status = status;
    if (search) where.eventName = { contains: search };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDateTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    const counts = await participantCounts(events.map((e) => e.id));
    const list = events.map((e) => ({ ...e, counts: counts.get(e.id) }));

    res.status(200).json({ success: true, events: toApi(list), pagination: paginate(page, limit, total) });
  } catch (error) {
    handleError(res, error, "getEvents");
  }
};

// GET /api/events/:id  -> event + participant counts (createdBy: { _id, name })
const getEventById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ success: false, message: "Event not found" });

    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { creator: { select: { id: true, name: true } } },
    });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const counts = await participantCounts([event.id]);
    const { creator, ...rest } = event;
    res.status(200).json({ success: true, event: toApi({ ...rest, createdBy: creator, counts: counts.get(event.id) }) });
  } catch (error) {
    handleError(res, error, "getEventById");
  }
};

// PUT /api/events/:id  (multipart: fields + optional eventBanner file; removeBanner=true se banner hatta sakte hain)
const updateEvent = async (req, res) => {
  const newBanner = req.file ? `${BANNER_URL_PREFIX}/${req.file.filename}` : null;
  try {
    const existing = isValidId(req.params.id) ? await prisma.event.findUnique({ where: { id: req.params.id } }) : null;
    if (!existing) {
      removeUploadedFile(newBanner);
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Purane + naye fields ko saath me validate karte hain (endDateTime > startDateTime)
    const merged = {};
    EVENT_FIELDS.forEach((key) => {
      merged[key] = existing[key];
    });
    const { errors, data } = validateEvent({ ...merged, ...pick(req.body) });
    if (errors.length) {
      removeUploadedFile(newBanner);
      return res.status(400).json({ success: false, message: errors.join(", ") });
    }

    const oldBanner = existing.eventBanner;
    let eventBanner = oldBanner;
    if (newBanner) eventBanner = newBanner;
    else if (req.body.removeBanner === "true") eventBanner = null;

    const event = await prisma.event.update({ where: { id: existing.id }, data: { ...data, eventBanner } });

    // Purani file tabhi hatate hain jab DB update successful ho chuka ho
    if (oldBanner && oldBanner !== event.eventBanner) removeUploadedFile(oldBanner);

    res.status(200).json({ success: true, message: "Event updated successfully", event: toApi(event) });
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

    const exists = isValidId(req.params.id) && (await prisma.event.count({ where: { id: req.params.id } }));
    if (!exists) return res.status(404).json({ success: false, message: "Event not found" });

    const event = await prisma.event.update({ where: { id: req.params.id }, data: { status } });
    res.status(200).json({ success: true, message: "Event status updated", event: toApi(event) });
  } catch (error) {
    handleError(res, error, "updateEventStatus");
  }
};

// DELETE /api/events/:id  (participants aur unke call logs DB cascade se hat jate hain)
const deleteEvent = async (req, res) => {
  try {
    const event = isValidId(req.params.id) ? await prisma.event.findUnique({ where: { id: req.params.id } }) : null;
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    await prisma.event.delete({ where: { id: event.id } });
    removeUploadedFile(event.eventBanner);

    res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    handleError(res, error, "deleteEvent");
  }
};

// POST /api/events/:id/sync-participants  (event ke baad join hue ACTIVE members ko add karta hai)
const syncParticipants = async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !(await prisma.event.count({ where: { id: req.params.id } }))) {
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

    const where = { eventId: req.params.id };
    if (PARTICIPATION_STATUSES.includes(status)) where.participationStatus = status;
    if (search) {
      where.member = {
        OR: [{ name: { contains: search } }, { surname: { contains: search } }, { mobileNumber: { contains: search } }],
      };
    }

    const [rows, total] = await Promise.all([
      prisma.eventParticipant.findMany({
        where,
        orderBy: [{ member: { name: "asc" } }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          participationStatus: true,
          callCount: true,
          lastCalledAt: true,
          lastCallStatus: true,
          member: {
            select: {
              id: true,
              photoUrl: true,
              name: true,
              surname: true,
              mobileNumber: true,
              memberType: true,
              memberStatus: true,
            },
          },
        },
      }),
      prisma.eventParticipant.count({ where }),
    ]);

    res.status(200).json({ success: true, participants: toApi(rows), pagination: paginate(page, limit, total) });
  } catch (error) {
    handleError(res, error, "getParticipants");
  }
};

// Participant us event ka hi hai ya nahi (URL tampering se doosre event ka participant na chhua jaye)
const findParticipant = (eventId, participantId) =>
  isValidId(eventId) && isValidId(participantId)
    ? prisma.eventParticipant.findFirst({ where: { id: participantId, eventId } })
    : null;

// PATCH /api/events/:id/participants/:participantId  { participationStatus }
const updateParticipantStatus = async (req, res) => {
  try {
    const { participationStatus } = req.body;
    if (!PARTICIPATION_STATUSES.includes(participationStatus)) {
      return res.status(400).json({ success: false, message: "Invalid participation status" });
    }

    const found = await findParticipant(req.params.id, req.params.participantId);
    if (!found) return res.status(404).json({ success: false, message: "Participant not found" });

    const participant = await prisma.eventParticipant.update({ where: { id: found.id }, data: { participationStatus } });

    res.status(200).json({ success: true, message: "Participation status updated", participant: toApi(participant) });
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

    const response = typeof callResponse === "string" && callResponse.trim() ? callResponse.trim() : null;
    if (response && response.length > 1000) {
      return res.status(400).json({ success: false, message: "Call response must be at most 1000 characters" });
    }

    const participant = await findParticipant(req.params.id, req.params.participantId);
    if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

    // Call + summary ek transaction me; lastCalledAt sirf tab badalta hai jab ye call sabse naya ho (purani call backfill ho sakti hai)
    const [call, updated] = await prisma.$transaction(async (tx) => {
      const created = await tx.eventCall.create({
        data: {
          eventParticipantId: participant.id,
          callStatus,
          callResponse: response,
          calledAt: calledAtDate,
          calledBy: req.user.id,
        },
      });

      const latest = await tx.eventCall.findFirst({
        where: { eventParticipantId: participant.id },
        orderBy: [{ calledAt: "desc" }, { createdAt: "desc" }],
      });

      const data = {
        callCount: { increment: 1 },
        lastCalledAt: latest.calledAt,
        lastCallStatus: latest.callStatus,
      };
      if (participationStatus) data.participationStatus = participationStatus;

      return [created, await tx.eventParticipant.update({ where: { id: participant.id }, data })];
    });

    res.status(201).json({ success: true, message: "Call logged successfully", call: toApi(call), participant: toApi(updated) });
  } catch (error) {
    handleError(res, error, "addCall");
  }
};

// GET /api/events/:id/participants/:participantId/calls  -> poori call history (latest first), calledBy: { _id, name }
const getCalls = async (req, res) => {
  try {
    const participant = await findParticipant(req.params.id, req.params.participantId);
    if (!participant) return res.status(404).json({ success: false, message: "Participant not found" });

    const rows = await prisma.eventCall.findMany({
      where: { eventParticipantId: participant.id },
      orderBy: [{ calledAt: "desc" }, { createdAt: "desc" }],
      include: { caller: { select: { id: true, name: true } } },
    });
    const calls = rows.map(({ caller, ...c }) => ({ ...c, calledBy: caller }));

    res.status(200).json({ success: true, calls: toApi(calls), participant: toApi(participant) });
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
