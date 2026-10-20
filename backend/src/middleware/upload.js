const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "../../public/uploads");
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// Extension original filename se nahi, mimetype se decide hota hai (user ka naam trust nahi karte)
const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// folder: public/uploads ke andar ka folder, field: form me file field ka naam, label: error message me naam
const createImageUpload = ({ folder, field, label }) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });

  const single = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype]}`),
    }),
    limits: { fileSize: MAX_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
      if (ALLOWED[file.mimetype]) return cb(null, true);
      cb(new Error("Only JPG, PNG or WEBP images are allowed"));
    },
  }).single(field);

  // Multer ke errors ko clean JSON 400 me badalta hai
  return (req, res, next) => {
    single(req, res, (err) => {
      if (!err) return next();
      const message = err.code === "LIMIT_FILE_SIZE" ? `${label} must be 2MB or smaller` : err.message;
      res.status(400).json({ success: false, message });
    });
  };
};

// Public URL path jo DB me save hota hai
const PHOTO_URL_PREFIX = "/uploads/members";
const BANNER_URL_PREFIX = "/uploads/events";

const uploadMemberPhoto = createImageUpload({ folder: "members", field: "photo", label: "Photo" });
const uploadEventBanner = createImageUpload({ folder: "events", field: "eventBanner", label: "Banner" });

// DB me saved URL path (jaise "/uploads/events/x.jpg") se disk ki file hata deta hai. Sirf uploads folder ke andar ki.
const removeUploadedFile = (urlPath) => {
  if (!urlPath || !urlPath.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOAD_ROOT, urlPath.slice("/uploads/".length));
  if (filePath.startsWith(UPLOAD_ROOT + path.sep)) fs.unlink(filePath, () => {});
};

module.exports = { uploadMemberPhoto, uploadEventBanner, removeUploadedFile, PHOTO_URL_PREFIX, BANNER_URL_PREFIX };
