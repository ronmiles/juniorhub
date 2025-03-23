import express, { Router } from "express";
import passport from "passport";
import {
  googleAuth,
  completeOAuthSignup,
  googleCallback,
} from "../../controllers/auth/googleAuthController";
import { FRONTEND_URL, LOGIN_PATH } from "../../utils/constants";
import { SwaggerPathsType } from "../../types/swagger";

export const googleAuthPaths: SwaggerPathsType = {
  "/api/auth/google": {
    get: {
      summary: "Initiate Google OAuth flow",
      tags: ["Google Authentication"],
      responses: {
        "302": {
          description: "Redirect to Google authentication",
        },
      },
    },
  },
  "/api/auth/google/callback": {
    get: {
      summary: "Google OAuth callback",
      tags: ["Google Authentication"],
      parameters: [
        {
          in: "query",
          name: "code",
          schema: {
            type: "string",
          },
          description: "OAuth code",
        },
      ],
      responses: {
        "302": {
          description: "Redirect after successful authentication",
        },
      },
    },
  },
};

const router: Router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Google Authentication
 *   description: Google OAuth authentication
 */

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
router.post("/", googleAuth);

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

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth flow
 *     tags: [Google Authentication]
 *     responses:
 *       302:
 *         description: Redirect to Google authentication
 */
router.get(
  "/",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Google Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: OAuth code
 *     responses:
 *       302:
 *         description: Redirect after successful authentication
 */
router.get(
  "/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}${LOGIN_PATH}?error=google_auth_failed`,
  }),
  googleCallback
);

export default router;
