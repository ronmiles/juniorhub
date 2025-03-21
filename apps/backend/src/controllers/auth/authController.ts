import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../../models/User";
import { generateTokens, verifyRefreshToken } from "../../utils/jwt";
import bcrypt from "bcrypt";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: errors.array(),
      });

      return;
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "User already exists with this email",
      });

      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const user = new User(userData);
    await user.save();

    // Generate JWT tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    user.accessToken = tokens.accessToken;

    await user.save();

    const returnedUserData = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(201).json({
      success: true,
      data: {
        user: returnedUserData,
        tokens,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const completeRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: errors.array(),
      });

      return;
    }

    const {
      role,
      userId,
      portfolio,
      skills,
      experienceLevel,
      companyName,
      website,
      industry,
    } = req.body;

    const user = await User.findById(userId);

    if (role === "junior") {
      user["portfolio"] = portfolio || [];
      user["skills"] = skills || [];
      user["experienceLevel"] = experienceLevel;
    } else if (role === "company") {
      user["companyName"] = companyName;
      user["website"] = website || "";
      user["industry"] = industry;
    }

    console.log("hello2", { user });
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        user,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Find user by email and select password field (which is normally excluded)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(400).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Generate JWT tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token",
      });
      return;
    }

    // Find user by ID and check refresh token
    const user = await User.findById(decoded.userId).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({
        success: false,
        error: "Invalid refresh token",
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Update refresh token in database
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        tokens,
      },
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear refresh token from user
    if (req.user) {
      const user = await User.findById(req.user.userId);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          bio: user.bio,
          skills: user.skills,
        },
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};
