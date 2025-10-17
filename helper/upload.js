// upload.js
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public/images")),
  filename: (req, file, cb) => {
    const base = path.parse(file.originalname).name.replace(/\s+/g, "_");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,     // 10 MB per file (thumbnail)
    fieldSize: 50 * 1024 * 1024,    // 50 MB for EACH text field (like `content`)
    fields: 100,                    // optional: max number of non-file fields
    files: 5,                       // optional: max number of files
    parts: 200,                     // optional: total parts (fields + files)
  },
});

module.exports = upload;
