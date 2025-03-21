import { Request, Response } from "express";
import User from "../../models/User";
import { generateTokens } from "../../utils/jwt";
import axios from "axios";
import {
  FRONTEND_URL,
  LOGIN_PATH,
  OAUTH_CALLBACK_PATH,
  DASHBOARD_PATH,
} from "../../utils/constants";

/**
 * Complete OAuth signup with role selection
 * @route POST /api/auth/complete-oauth-signup
 * @access Public
 */
export const completeOAuthSignup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Received OAuth completion request:", req.body);

    const {
      userId,
      provider,
      role,
      email,
      name,
      // Junior specific fields
      experienceLevel,
      skills,
      portfolio,
      // Company specific fields
      companyName,
      website,
      industry,
    } = req.body;

    // Validate required fields
    if (!userId || !provider || !role || !email || !name) {
      res.status(400).json({
        success: false,
        error: "Missing required fields (userId, provider, role, email, name)",
      });
      return;
    }

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

    console.log(`Looking for user with ${provider}Id: ${userId}`);

    // Find user by provider ID or email (as fallback)
    let user;
    const query: any = { $or: [{ email }] };

    if (provider === "google") {
      query.$or.push({ googleId: userId });
    }

    user = await User.findOne(query);
    console.log("User search result:", user ? "Found" : "Not found");

    // If user doesn't exist, create a new one
    if (!user) {
      console.log("Creating new user");

      // Create new user
      const userData: any = {
        name,
        email,
        role,
        password: null, // No password for OAuth users
      };

      // Add provider-specific ID
      if (provider === "google") {
        userData.googleId = userId;
      }

      // Add role-specific fields
      if (role === "junior") {
        userData.experienceLevel = experienceLevel;
        userData.skills = skills || [];
        userData.portfolio = portfolio ? [portfolio] : [];
      } else if (role === "company") {
        userData.companyName = companyName;
        userData.website = website || "";
        userData.industry = industry;
      }

      user = new User(userData);
    } else {
      console.log("Updating existing user");

      // Update existing user with provider ID if not set
      if (provider === "google" && !user.googleId) {
        user.googleId = userId;
      }

      // Update user with role and role-specific fields
      user.role = role;

      if (role === "junior") {
        user.experienceLevel = experienceLevel;
        user.skills = skills || [];
        user.portfolio = portfolio ? [portfolio] : [];
      } else if (role === "company") {
        user.companyName = companyName;
        user.website = website || "";
        user.industry = industry;
      }
    }

    // Save user
    await user.save();
    console.log("User saved successfully");

    // Generate tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Prepare user data for response with role-specific fields
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };

    // Add role-specific fields to response
    if (user.role === "junior") {
      Object.assign(userData, {
        portfolio: user.portfolio,
        skills: user.skills,
        experienceLevel: user.experienceLevel,
      });
    } else if (user.role === "company") {
      Object.assign(userData, {
        companyName: user.companyName,
        website: user.website,
        industry: user.industry,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        tokens,
      },
    });
  } catch (error) {
    console.error("Error in completeOAuthSignup:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

/**
 * Google OAuth login/register
 * @route POST /api/auth/google
 * @access Public
 */
export const googleAuth = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      token,
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

    if (!token) {
      res.status(400).json({
        success: false,
        error: "Google token is required",
      });
      return;
    }

    // Verify Google token
    const googleResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
    );

    if (!googleResponse.data) {
      res.status(400).json({
        success: false,
        error: "Invalid Google token",
      });
      return;
    }

    const { email, name, sub: googleId } = googleResponse.data;

    // Check if user exists
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // For new users, role is required
      if (!role) {
        // Send specific guidance for how to complete signup
        res.status(400).json({
          success: false,
          error: "Role is required for new users",
          isNewUser: true,
          message:
            "You need to complete your profile by selecting a role (junior or company) and providing required information",
          nextSteps: {
            junior: {
              required: ["role", "experienceLevel"],
              optional: ["portfolio", "skills"],
            },
            company: {
              required: ["role", "companyName", "industry"],
              optional: ["website"],
            },
          },
          profileData: {
            email,
            name,
            googleId,
          },
        });
        return;
      }

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

      // Create new user with role-specific fields
      const userData: any = {
        name,
        email,
        googleId,
        role,
        password: null, // No password for OAuth users
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

      user = new User(userData);
      await user.save();
      isNewUser = true;
    }

    // Generate tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    // Prepare user data for response with role-specific fields
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };

    // Add role-specific fields to response
    if (user.role === "junior") {
      Object.assign(userData, {
        portfolio: user.portfolio,
        skills: user.skills,
        experienceLevel: user.experienceLevel,
      });
    } else if (user.role === "company") {
      Object.assign(userData, {
        companyName: user.companyName,
        website: user.website,
        industry: user.industry,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        tokens,
        isNewUser,
      },
    });
  } catch (error) {
    console.error("Error in googleAuth:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

export const googleCallback = async (req, res) => {
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
  const tokens = generateTokens(user.userId || user._id.toString(), user.role);

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
};
