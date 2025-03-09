import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

// Extend Express Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer [token]

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
    });
    return;
  }

  // Verify token
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token.',
    });
    return;
  }

  // Attach user info to request
  req.user = {
    userId: decoded.userId,
    role: decoded.role,
  };

  next();
};

/**
 * Middleware to restrict routes based on user roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'You are not authorized to access this resource.',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to authorize only the own user (for user-specific routes)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authorizeOwn = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
    return;
  }

  // Check if the requested user ID matches the authenticated user's ID
  const requestedUserId = req.params.userId || req.params.id;
  
  if (requestedUserId && req.user.userId !== requestedUserId && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'You are not authorized to access this resource.',
    });
    return;
  }

  next();
}; 