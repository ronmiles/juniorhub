import express from "express";
import cors from "cors";
import morgan from "morgan";
import { json, urlencoded } from "body-parser";
import swaggerUi from "swagger-ui-express";
import http from "http";
import passport from "passport";
import path from "path";
import connectDB from "./config/db";
import config from "./config/config";
import { initSocketServer } from "./utils/socket";
import "./config/passport"; // Import passport config to initialize strategies

// Import routes with their Swagger paths
import authRoutes, { authPaths } from "./routes/auth/authRoutes";
import googleAuthRoutes, {
  googleAuthPaths,
} from "./routes/auth/googleAuthRoutes";
import projectRoutes, {
  projectPaths,
  projectComponents,
} from "./routes/projectRoutes";
import userRoutes, { userPaths, userComponents } from "./routes/userRoutes";
import applicationRoutes, {
  applicationPaths,
  applicationComponents,
} from "./routes/applicationRoutes";
import notificationRoutes, {
  notificationPaths,
  notificationComponents,
} from "./routes/notificationRoutes";
import aiRoutes, { aiPaths } from "./routes/aiRoutes";
import commentRoutes, {
  commentPaths,
  commentComponents,
} from "./routes/commentRoutes";

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(json());
app.use(urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, "..", "uploads");
app.use("/api/uploads", express.static(uploadsPath));
console.log("Serving static files from:", uploadsPath);

// Define your Swagger document with imported paths
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "JuniorHub API Documentation",
    version: "1.0.0",
    description:
      "API documentation for connecting junior developers with companies",
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  // Combine all paths from different route files
  paths: {
    ...authPaths,
    ...googleAuthPaths,
    ...projectPaths,
    ...userPaths,
    ...applicationPaths,
    ...notificationPaths,
    ...aiPaths,
    ...commentPaths,
  },
  // Combine all components
  components: {
    ...projectComponents,
    ...userComponents,
    ...applicationComponents,
    ...notificationComponents,
    ...commentComponents,
  },
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth/google", googleAuthRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", commentRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Server error",
  });
});

// Start server
const port = config.port;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api-docs`
  );
});
