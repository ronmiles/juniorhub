import jwt from 'jsonwebtoken';
import config from '../config/config';
import { AuthTokens } from '@juniorhub/types';
import ms from 'ms';
// Define the payload structure for JWT
interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Generate access and refresh tokens for a user
 * @param userId - User ID to include in JWT payload
 * @param role - User role to include in JWT payload
 * @returns Object containing access and refresh tokens
 */
export const generateTokens = (userId: string, role: string): AuthTokens => { 
  // Generate access token
  const accessToken = jwt.sign(
    {
        data: { userId, role },
    }, 
    config.jwtSecret, 
    { expiresIn: ms(config.jwtExpiresIn) });

  // Generate refresh token
  const refreshToken = jwt.sign({
    data: { userId },
  },
    config.jwtRefreshSecret,
    { expiresIn: ms(config.jwtRefreshExpiresIn) }
  );

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify an access token
 * @param token - JWT access token to verify
 * @returns Decoded token payload if valid, null otherwise
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload if valid, null otherwise
 */
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Generate a new access token from a refresh token
 * @param refreshToken - Valid refresh token
 * @param role - User role
 * @returns New access token if refresh token is valid, null otherwise
 */
export const refreshAccessToken = (refreshToken: string, role: string): string | null => {
  const decoded = verifyRefreshToken(refreshToken);
  
  if (!decoded) {
    return null;
  }
  
  // Generate new access token
  const accessToken = jwt.sign(
    { data: { userId: decoded.userId, role } },
    config.jwtSecret,
    { expiresIn: ms(config.jwtExpiresIn) }
  );
  
  return accessToken;
}; 