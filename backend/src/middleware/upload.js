const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "../../public/uploads/members");
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Extension original filename se nahi, mimetype se decide hota hai (user ka naam trust nahi karte)
const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype]}`),
  }),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    cb(new Error("Only JPG, PNG or WEBP images are allowed"));
  },
});

const single = upload.single("photo");

// Multer ke errors ko clean JSON 400 me badalta hai
const uploadMemberPhoto = (req, res, next) => {
  single(req, res, (err) => {
    if (!err) return next();
    const message = err.code === "LIMIT_FILE_SIZE" ? "Photo must be 2MB or smaller" : err.message;
    res.status(400).json({ success: false, message });
  });
};

// Public URL path jo DB me save hota hai
const PHOTO_URL_PREFIX = "/uploads/members";

module.exports = { uploadMemberPhoto, PHOTO_URL_PREFIX };
