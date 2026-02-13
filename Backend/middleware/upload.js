const multer = require("multer");
const path = require("path");

/**
 * Storage configuration
 * Files will be stored in Backend/Uploads/
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "Uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

/**
 * File filter: Allow PDF only
 */
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF files are allowed."),
      false
    );
  }
};

/**
 * Multer instance
 * Max file size = 10MB
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * Export different upload handlers
 */
module.exports = {
  uploadSingle: upload.single("file"),
  uploadMultiple: upload.array("files", 5)
};
