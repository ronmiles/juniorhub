import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "profiles");
console.log("Upload directory path:", uploadDir);

if (!fs.existsSync(uploadDir)) {
  console.log("Creating upload directory:", uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
} else {
  console.log("Upload directory already exists");
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Multer destination called, saving to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: userId-timestamp.ext
    const userId = req.params.id || "unknown";
    const fileExt = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${userId}-${timestamp}${fileExt}`;
    console.log("Generated filename:", filename);
    cb(null, filename);
  },
});

// File filter to only allow specific image formats
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  console.log(
    "File filter called with file:",
    file.originalname,
    file.mimetype
  );
  // Accept only jpeg, png, and webp formats
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp"
  ) {
    console.log("File type accepted");
    cb(null, true);
  } else {
    console.log("File type rejected");
    cb(null, false);
    return cb(new Error("Only .jpeg, .png, and .webp formats are allowed!"));
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
});

// Middleware to handle profile picture upload
export const uploadProfilePicture = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("uploadProfilePicture middleware triggered");
  console.log("Request headers:", req.headers);
  console.log("Request body keys:", Object.keys(req.body || {}));
  console.log("Request files:", req.files);

  const uploader = upload.single("profilePicture");
  uploader(req, res, (err: any) => {
    console.log("Multer callback triggered");
    console.log("File after multer processing:", req.file);
    if (err) {
      console.error("Multer error:", err);
      return next(err);
    }
    next();
  });
};

// Error handling middleware for multer
export const handleUploadError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("Upload error handler called with error:", err?.message);
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === "LIMIT_FILE_SIZE") {
      console.log("File size limit exceeded");
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 5MB.",
      });
    }
    console.log("Multer error:", err.code);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  } else if (err) {
    // A non-Multer error occurred
    console.log("Non-multer error:", err.message);
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // If no error, continue
  console.log("No upload errors, continuing");
  next();
};

// Utility function to delete an old profile picture
export const deleteProfilePicture = (filePath: string) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("Error deleting old profile picture:", error);
    }
  }
};
