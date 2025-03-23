import express, { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  completeRegister,
} from "../../controllers/auth/authController";
import { authenticate } from "../../middleware/auth";
import { SwaggerPathsType } from "../../types/swagger";

export const authPaths: SwaggerPathsType = {
  "/api/auth/register": {
    post: {
      summary: "Register a new user",
      tags: ["Authentication"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password", "name"],
              properties: {
                name: {
                  type: "string",
                },
                email: {
                  type: "string",
                },
                password: {
                  type: "string",
                  format: "password",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "User registered successfully",
        },
        "400": {
          description: "Invalid input data",
        },
        "409": {
          description: "User already exists",
        },
      },
    },
  },
  "/api/auth/login": {
    post: {
      summary: "Login a user",
      tags: ["Authentication"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                },
                password: {
                  type: "string",
                  format: "password",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: {
                    type: "string",
                  },
                  user: {
                    type: "object",
                  },
                },
              },
            },
          },
        },
        "401": {
          description: "Invalid credentials",
        },
      },
    },
  },
  "/api/auth/refresh-token": {
    post: {
      summary: "Refresh authentication token",
      tags: ["Authentication"],
      responses: {
        "200": {
          description: "Token refreshed successfully",
        },
        "401": {
          description: "Invalid or expired token",
        },
      },
    },
  },
  "/api/auth/logout": {
    post: {
      summary: "Logout user",
      tags: ["Authentication"],
      responses: {
        "200": {
          description: "Logout successful",
        },
      },
    },
  },
  "/api/auth/me": {
    get: {
      summary: "Get current user",
      tags: ["Authentication"],
      responses: {
        "200": {
          description: "User details",
        },
        "401": {
          description: "Unauthorized",
        },
      },
    },
  },
};

const router: Router = express.Router();

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

router.post("/register/complete", completeRegister);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please include a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  login
);

router.post("/refresh-token", refreshToken);

router.post("/logout", authenticate, logout);

router.get("/me", authenticate, getCurrentUser);

export default router;
