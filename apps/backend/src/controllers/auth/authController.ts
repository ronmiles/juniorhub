import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User from "../../models/User";
import { generateTokens, verifyRefreshToken } from "../../utils/jwt";

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
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

    const {
      name,
      email,
      password,
      role,
      // Junior specific fields
      portfolio,
      skills,
      experienceLevel,
      // Company specific fields
      companyName,
      website,
      industry,
    } = req.body;

    // Validate role
    if (!["junior", "company"].includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role. Must be either "junior" or "company"',
      });
      return;
    }

    // Validate role-specific required fields
    if (role === "junior" && !experienceLevel) {
      res.status(400).json({
        success: false,
        error: "Experience level is required for junior users",
      });
      return;
    }

    if (role === "company" && !companyName) {
      res.status(400).json({
        success: false,
        error: "Company name is required for company users",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "User already exists with this email",
      });
      return;
    }

    // Create new user with role-specific fields
    const userData: any = {
      name,
      email,
      password,
      role,
    };

    // Add role-specific fields
    if (role === "junior") {
      userData.portfolio = portfolio || [];
      userData.skills = skills || [];
      userData.experienceLevel = experienceLevel;
    } else if (role === "company") {
      userData.companyName = companyName;
      userData.website = website || "";
      userData.industry = industry;
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Return success response with role-specific user data
    const userData2 = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Add role-specific fields to response
    if (user.role === "junior") {
      Object.assign(userData2, {
        portfolio: user.portfolio,
        skills: user.skills,
        experienceLevel: user.experienceLevel,
      });
    } else if (user.role === "company") {
      Object.assign(userData2, {
        companyName: user.companyName,
        website: user.website,
        industry: user.industry,
      });
    }

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        user: userData2,
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
