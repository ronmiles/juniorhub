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

router.post("/", googleAuth);

router.post("/complete-oauth-signup", completeOAuthSignup);

router.get(
  "/",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}${LOGIN_PATH}?error=google_auth_failed`,
  }),
  googleCallback
);

export default router;
