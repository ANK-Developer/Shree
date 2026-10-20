const fs = require("fs");
const { prisma } = require("../config/db");
const { toApi, isValidId } = require("../utils/toApi");
const { validateMember } = require("../utils/memberValidation");
const { PHOTO_URL_PREFIX } = require("../middleware/upload");

const STATUSES = ["ACTIVE", "INACTIVE"];

// Public form se sirf yehi fields accept hote hain (memberStatus jaise fields client se nahi aate)
const PERSONAL_FIELDS = [
  "name",
  "fatherHusbandName",
  "surname",
  "memberType",
  "bloodGroup",
  "aadharNumber",
  "occupation",
  "address",
  "pincode",
  "mobileNumber",
  "email",
  "birthDate",
];

// List/table me itne hi fields chahiye
const LIST_SELECT = {
  id: true,
  photoUrl: true,
  name: true,
  surname: true,
  mobileNumber: true,
  memberType: true,
  memberStatus: true,
  createdAt: true,
};

// Child rows form ke order me, bina internal columns (memberId, sortOrder) ke
const childRows = (fields) => ({ orderBy: { sortOrder: "asc" }, select: { id: true, ...fields } });
const MEMBER_INCLUDE = {
  familyMembers: childRows({ name: true, relation: true, dob: true, mobile: true }),
  nominees: childRows({ name: true, relation: true, mobile: true }),
  referrals: childRows({ name: true, mobile: true }),
};

const removeFile = (file) => {
  if (file) fs.unlink(file.path, () => {});
};

// multipart form me arrays JSON string ban kar aate hain
const parseList = (value) => {
  if (value === undefined || value === "") return [];
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) throw new Error("not an array");
  return parsed;
};

const isBlankRow = (row) => Object.values(row).every((v) => !String(v ?? "").trim());

const pageParams = (query) => ({
  page: Math.max(parseInt(query.page, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50),
});

const searchFilter = (search) =>
  search ? { OR: [{ name: { contains: search } }, { mobileNumber: { contains: search } }] } : {};

// POST /api/members  (public membership form)
const createMember = async (req, res) => {
  try {
    let familyMembers, nominees, referrals;
    try {
      familyMembers = parseList(req.body.familyMembers).filter((r) => !isBlankRow(r));
      nominees = parseList(req.body.nominees);
      referrals = parseList(req.body.referrals).filter((r) => !isBlankRow(r));
    } catch {
      removeFile(req.file);
      return res.status(400).json({ success: false, message: "Invalid family, nominee or referral data" });
    }

    const data = {};
    PERSONAL_FIELDS.forEach((key) => {
      data[key] = req.body[key];
    });
    data.anniversaryDate = req.body.anniversaryDate || null;
    data.familyMembers = familyMembers;
    data.nominees = nominees;
    data.referrals = referrals;
    data.photoUrl = req.file ? `${PHOTO_URL_PREFIX}/${req.file.filename}` : "";

    const v = validateMember(data);
    if (v.errors.length) {
      removeFile(req.file); // validation fail hui to uploaded photo orphan na rahe
      return res.status(400).json({ success: false, message: v.errors.join(", ") });
    }

    // Member + uske family/nominee/referral rows ek hi transaction me
    const member = await prisma.member.create({
      data: {
        ...v.member,
        familyMembers: { create: v.familyMembers },
        nominees: { create: v.nominees },
        referrals: { create: v.referrals },
      },
      select: { id: true, name: true },
    });

    res.status(201).json({
      success: true,
      message: "Membership form submitted successfully",
      member: toApi(member),
    });
  } catch (error) {
    removeFile(req.file);

    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "This mobile number is already registered" });
    }
    console.error("createMember failed:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/members?page=&limit=&search=&status=
const getMembers = async (req, res) => {
  try {
    const { page, limit } = pageParams(req.query);
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").toUpperCase();

    const where = searchFilter(search);
    if (STATUSES.includes(status)) where.memberStatus = status;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      members: toApi(members),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Member counts: { total, active, inactive }  (dashboard bhi yahi use karta hai)
const memberStats = async () => {
  const counts = await prisma.member.groupBy({ by: ["memberStatus"], _count: { _all: true } });
  const byStatus = Object.fromEntries(counts.map((c) => [c.memberStatus, c._count._all]));
  const active = byStatus.ACTIVE || 0;
  const inactive = byStatus.INACTIVE || 0;
  return { total: active + inactive, active, inactive };
};

// GET /api/members/stats  (filters/search se independent: total, active, inactive)
const getMemberStats = async (req, res) => {
  try {
    res.status(200).json({ success: true, stats: await memberStats() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Jin members ne is member ka mobile number "referrer mobile" me diya hai, unhe isne refer kiya hai
const referredFilter = (member) => ({ referrals: { some: { mobile: member.mobileNumber } }, id: { not: member.id } });

// GET /api/members/:id
const getMemberById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid member id" });
    }
    const member = await prisma.member.findUnique({ where: { id: req.params.id }, include: MEMBER_INCLUDE });
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const referredCount = await prisma.member.count({ where: referredFilter(member) });

    res.status(200).json({ success: true, member: toApi(member), referredCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/members/:id/referred?page=&limit=&search=   (is member ne jinhe refer kiya)
const getReferredMembers = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid member id" });
    }
    const member = await prisma.member.findUnique({ where: { id: req.params.id }, select: { id: true, mobileNumber: true } });
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const { page, limit } = pageParams(req.query);
    const search = String(req.query.search || "").trim();

    const where = { AND: [referredFilter(member), searchFilter(search)] };

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      members: toApi(members),
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/members/:id/status  body: { memberStatus: "ACTIVE" | "INACTIVE" }
const updateMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { memberStatus } = req.body;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid member id" });
    }
    if (!STATUSES.includes(memberStatus)) {
      return res.status(400).json({ success: false, message: "memberStatus must be ACTIVE or INACTIVE" });
    }

    const { count } = await prisma.member.updateMany({ where: { id }, data: { memberStatus } });
    if (count === 0) return res.status(404).json({ success: false, message: "Member not found" });
    const member = await prisma.member.findUnique({ where: { id }, include: MEMBER_INCLUDE });

    res.status(200).json({
      success: true,
      message: `Member ${memberStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      member: toApi(member),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  memberStats,
  createMember,
  getMembers,
  getMemberStats,
  getMemberById,
  getReferredMembers,
  updateMemberStatus,
};
