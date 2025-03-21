import express, { Router } from "express";
import passport from "passport";
import { body } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
} from "../../controllers/auth/authController";
import {
  googleAuth,
  completeOAuthSignup,
} from "../../controllers/auth/googleAuthController";
import { authenticate } from "../../middleware/auth";
import config from "../../config/config";
import { generateTokens } from "../../utils/jwt";
import User from "../../models/User";

const router: Router = express.Router();

// Configure frontend URLs
const FRONTEND_URL = config.clientUrl || "http://localhost:4200";
const OAUTH_CALLBACK_PATH = "/oauth-callback";
const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [junior, company]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  login
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens generated
 *       400:
 *         description: Invalid refresh token
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authenticate, logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Authenticate with Google token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [junior, company]
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid token
 */
router.post("/google", googleAuth);

/**
 * @swagger
 * /api/auth/complete-oauth-signup:
 *   post:
 *     summary: Complete OAuth signup by selecting role and providing role-specific details
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - provider
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [google]
 *               role:
 *                 type: string
 *                 enum: [junior, company]
 *               experienceLevel:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               portfolio:
 *                 type: string
 *               companyName:
 *                 type: string
 *               website:
 *                 type: string
 *               industry:
 *                 type: string
 *     responses:
 *       200:
 *         description: OAuth signup completed successfully
 *       400:
 *         description: Invalid data provided
 *       404:
 *         description: User not found
 */
router.post("/complete-oauth-signup", completeOAuthSignup);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}${LOGIN_PATH}?error=google_auth_failed`,
  }),
  async (req, res) => {
    console.log("Google callback received:", req.user);

    // Use type assertion to any first to handle different user object structures
    const user = req.user as any;
    // Check if user needs to select a role
    if (!user.role || user.needsRoleSelection) {
      // Make sure we have Google data
      if (!user.googleProfile) {
        console.log("Missing Google profile data");
        return res.redirect(
          `${FRONTEND_URL}${LOGIN_PATH}?error=missing_google_data`
        );
      }

      // Create a structured URL with user data for role selection
      const params = new URLSearchParams({
        provider: "google",
        userId: user.googleProfile.id, // Use googleProfile.id as userId
        email: user.googleProfile.email,
        name: user.googleProfile.name,
      });

      // Add profile picture if available
      if (user.googleProfile.picture) {
        params.append("picture", user.googleProfile.picture);
      }

      console.log(
        "Redirecting to OAuth callback with params:",
        params.toString()
      );
      return res.redirect(
        `${FRONTEND_URL}${OAUTH_CALLBACK_PATH}?${params.toString()}`
      );
    }

    // User already has a role, generate tokens
    const tokens = generateTokens(user.userId || user._id.toString());

    // Save refresh token
    if (user.save) {
      user.refreshToken = tokens.refreshToken;
      user
        .save()
        .catch((err: any) => console.error("Error saving refresh token:", err));
    }

    // Determine dashboard based on role
    const dashboardUrl = `${FRONTEND_URL}${DASHBOARD_PATH}`;

    const user2 = await User.findById(user._id ?? user.userId).lean();
    // Include tokens in redirect
    console.error("user2", { user2 });
    console.error("user2._id", user2?._id?.toString());
    const redirectParams = new URLSearchParams({
      userId: user2?._id?.toString() ?? user.userId ?? "",
      name: user2?.name ?? "",
      email: user2?.email ?? "",
      role: user2?.role ?? "",
      profilePicture: user2?.profilePicture ?? "",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    console.log("Redirecting authenticated user to dashboard", {
      url: `${dashboardUrl}?${redirectParams.toString()}`,
    });
    res.redirect(`${dashboardUrl}?${redirectParams.toString()}`);
  }
);

export default router;
