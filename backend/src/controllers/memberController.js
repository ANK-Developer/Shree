const fs = require("fs");
const mongoose = require("mongoose");
const Member = require("../models/Member");
const escapeRegex = require("../utils/escapeRegex");
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
      data[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];
    });
    data.anniversaryDate = req.body.anniversaryDate || null;
    data.familyMembers = familyMembers.map((r) => ({ ...r, dob: r.dob || null }));
    data.nominees = nominees;
    data.referrals = referrals;
    data.photoUrl = req.file ? `${PHOTO_URL_PREFIX}/${req.file.filename}` : "";

    const member = await Member.create(data);

    res.status(201).json({
      success: true,
      message: "Membership form submitted successfully",
      member: { _id: member._id, name: member.name },
    });
  } catch (error) {
    removeFile(req.file); // validation fail hui to uploaded photo orphan na rahe

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "This mobile number is already registered" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error("createMember failed:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/members?page=&limit=&search=&status=
const getMembers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").toUpperCase();

    const filter = {};
    if (STATUSES.includes(status)) filter.memberStatus = status;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { mobileNumber: regex }];
    }

    const [members, total] = await Promise.all([
      Member.find(filter)
        .select("photoUrl name surname mobileNumber memberType memberStatus createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Member.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      members,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/members/stats  (filters/search se independent: total, active, inactive)
const getMemberStats = async (req, res) => {
  try {
    const counts = await Member.aggregate([{ $group: { _id: "$memberStatus", count: { $sum: 1 } } }]);
    const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    const active = byStatus.ACTIVE || 0;
    const inactive = byStatus.INACTIVE || 0;

    res.status(200).json({ success: true, stats: { total: active + inactive, active, inactive } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Jin members ne is member ka mobile number "referrer mobile" me diya hai, unhe isne refer kiya hai
const referredFilter = (member) => ({ "referrals.mobile": member.mobileNumber, _id: { $ne: member._id } });

// GET /api/members/:id
const getMemberById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid member id" });
    }
    const member = await Member.findById(req.params.id).lean();
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const referredCount = await Member.countDocuments(referredFilter(member));

    res.status(200).json({ success: true, member, referredCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/members/:id/referred?page=&limit=&search=   (is member ne jinhe refer kiya)
const getReferredMembers = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid member id" });
    }
    const member = await Member.findById(req.params.id).select("mobileNumber").lean();
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = String(req.query.search || "").trim();

    const filter = referredFilter(member);
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { mobileNumber: regex }];
    }

    const [members, total] = await Promise.all([
      Member.find(filter)
        .select("photoUrl name surname mobileNumber memberType memberStatus createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Member.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      members,
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

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid member id" });
    }
    if (!STATUSES.includes(memberStatus)) {
      return res.status(400).json({ success: false, message: "memberStatus must be ACTIVE or INACTIVE" });
    }

    const member = await Member.findByIdAndUpdate(id, { memberStatus }, { new: true, runValidators: false }).lean();
    if (!member) return res.status(404).json({ success: false, message: "Member not found" });

    res.status(200).json({
      success: true,
      message: `Member ${memberStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`,
      member,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createMember, getMembers, getMemberStats, getMemberById, getReferredMembers, updateMemberStatus };
