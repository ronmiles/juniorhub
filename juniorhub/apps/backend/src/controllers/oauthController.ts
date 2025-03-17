import { Request, Response } from 'express';
import User from '../models/User';
import { generateTokens } from '../utils/jwt';
import config from '../config/config';
import axios from 'axios';

/**
 * Google OAuth login/register
 * @route POST /api/auth/google
 * @access Public
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Google token is required',
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
        error: 'Invalid Google token',
      });
      return;
    }

    const { email, name, sub: googleId } = googleResponse.data;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        role: 'junior', // Default role
        password: null, // No password for OAuth users
      });

      await user.save();
    }

    // Generate tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error('Error in googleAuth:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Facebook OAuth login/register
 * @route POST /api/auth/facebook
 * @access Public
 */
export const facebookAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      res.status(400).json({
        success: false,
        error: 'Facebook access token is required',
      });
      return;
    }

    // Verify Facebook token and get user info
    const facebookResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );

    if (!facebookResponse.data) {
      res.status(400).json({
        success: false,
        error: 'Invalid Facebook token',
      });
      return;
    }

    const { email, name, id: facebookId } = facebookResponse.data;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email not provided by Facebook. Please check your Facebook privacy settings.',
      });
      return;
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Facebook ID if not set
      if (!user.facebookId) {
        user.facebookId = facebookId;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name,
        email,
        facebookId,
        role: 'junior', // Default role
        password: null, // No password for OAuth users
      });

      await user.save();
    }

    // Generate tokens
    const tokens = generateTokens(user._id.toString(), user.role);

    // Save refresh token to user
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
        },
        tokens,
      },
    });
  } catch (error) {
    console.error('Error in facebookAuth:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
}; 