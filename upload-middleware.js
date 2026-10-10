const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const multer = require("multer");

const ApiError = require("../utils/api-error");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");


fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB) || 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const extension =
      ALLOWED_MIME_TYPES[file.mimetype] ||
      path.extname(file.originalname).toLowerCase() ||
      ".jpg";

    cb(null, `${file.fieldname}-${unique}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) return cb(null, true);

  cb(
    ApiError.badRequest(
      `Unsupported file type '${file.mimetype}'. Allowed types: jpg, jpeg, png, webp.`
    )
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});


const uploadSingleImage = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          ApiError.badRequest(`Image is too large. Maximum size is ${MAX_SIZE_MB}MB.`)
        );
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next(
          ApiError.badRequest(
            `Unexpected file field '${err.field}'. Send the image as '${fieldName}'.`
          )
        );
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return next(ApiError.badRequest("Only one image can be uploaded at a time."));
      }
      return next(ApiError.badRequest(`Image upload failed: ${err.message}`));
    }

    next(err);
  });
};


const removeUploadedFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;

  const absolute = path.join(UPLOAD_DIR, path.basename(imagePath));

  fs.unlink(absolute, (err) => {
    if (err && err.code !== "ENOENT") {
      console.warn(`Could not delete image ${imagePath}: ${err.message}`);
    }
  });
};

module.exports = {
  uploadSingleImage,
  removeUploadedFile,
  UPLOAD_DIR,
  MAX_SIZE_MB,
  ALLOWED_MIME_TYPES,
};
