import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

// Ensure upload directories exist
const profilesUploadDir = path.join(__dirname, "..", "uploads", "profiles");
const projectsUploadDir = path.join(__dirname, "..", "uploads", "projects");
console.log("Profile upload directory path:", profilesUploadDir);
console.log("Project upload directory path:", projectsUploadDir);

if (!fs.existsSync(profilesUploadDir)) {
  console.log("Creating profile upload directory:", profilesUploadDir);
  fs.mkdirSync(profilesUploadDir, { recursive: true });
} else {
  console.log("Profile upload directory already exists");
}

if (!fs.existsSync(projectsUploadDir)) {
  console.log("Creating project upload directory:", projectsUploadDir);
  fs.mkdirSync(projectsUploadDir, { recursive: true });
} else {
  console.log("Project upload directory already exists");
}

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(
      "Multer destination called for profile, saving to:",
      profilesUploadDir
    );
    cb(null, profilesUploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: userId-timestamp.ext
    const userId = req.params.id || "unknown";
    const fileExt = path.extname(file.originalname);
    const timestamp = Date.now();
    const filename = `${userId}-${timestamp}${fileExt}`;
    console.log("Generated profile filename:", filename);
    cb(null, filename);
  },
});

// Configure storage for project images
const projectStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(
      "Multer destination called for project, saving to:",
      projectsUploadDir
    );
    cb(null, projectsUploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: projectId-index-timestamp.ext
    const projectId = req.params.id || req.body.projectId || "new-project";
    const fileExt = path.extname(file.originalname);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const filename = `${projectId}-${randomId}-${timestamp}${fileExt}`;
    console.log("Generated project image filename:", filename);
    cb(null, filename);
  },
});

// File filter to only allow specific image formats
const imageFileFilter = (
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

// Configure upload middleware for profiles
const profileUpload = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
});

// Configure upload middleware for projects
const projectUpload = multer({
  storage: projectStorage,
  fileFilter: imageFileFilter,
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

  const uploader = profileUpload.single("profilePicture");
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

// Middleware to handle project images upload (multiple images)
export const uploadProjectImages = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("uploadProjectImages middleware triggered");
  console.log("Request headers:", req.headers);
  console.log("Request body keys:", Object.keys(req.body || {}));

  const uploader = projectUpload.array("projectImages", 10); // Allow up to 10 images
  uploader(req, res, (err: any) => {
    console.log("Multer callback triggered for project images");
    console.log("Files after multer processing:", req.files);
    if (err) {
      console.error("Multer error:", err);
      return next(err);
    }
    next();
  });
};

// Helper function to delete a file
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
};

// Helper function to delete a profile picture
export const deleteProfilePicture = (filePath: string): void => {
  deleteFile(filePath);
};

// Helper function to delete project images
export const deleteProjectImage = (filePath: string): void => {
  deleteFile(filePath);
};

// Helper function to extract file path from URL
export const getFilePathFromUrl = (imageUrl: string): string | null => {
  if (!imageUrl) return null;

  // If it's a relative URL like /api/uploads/projects/file.jpg
  if (imageUrl.startsWith("/api/")) {
    const filePath = path.join(__dirname, "..", imageUrl.replace("/api/", ""));
    console.log("Converting URL to file path:", imageUrl, "->", filePath);
    return filePath;
  }

  return null;
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
