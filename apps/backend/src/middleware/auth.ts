import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

// Define our AuthUser interface
interface AuthUser {
  userId: string;
  id: string;
  role: string;
  needsRoleSelection?: boolean;
  googleProfile?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  facebookProfile?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

// Extend Express Request type to include our custom user
declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

/**
 * Authentication middleware
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'No token, authorization denied',
    });
    return;
  }
  
  // Verify token
  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    res.status(401).json({
      success: false,
      error: 'Token is not valid',
    });
    return;
  }
  
  // Set user data in request
  req.user = {
    userId: decoded.userId,
    id: decoded.userId, // Set id to be the same as userId for compatibility
    role: decoded.role,
  };
  
  next();
};

/**
 * Authorization middleware (role-based)
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource',
      });
      return;
    }
    
    next();
  };
};

/**
 * Junior-only route middleware
 */
export const juniorOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
    return;
  }
  
  // Check if user is a junior
  if (req.user.role !== 'junior') {
    res.status(403).json({
      success: false,
      error: 'This resource is only available to junior developers',
    });
    return;
  }
  
  next();
};

/**
 * Company-only route middleware
 */
export const companyOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
    return;
  }
  
  // Check if user is a company
  if (req.user.role !== 'company') {
    res.status(403).json({
      success: false,
      error: 'This resource is only available to companies',
    });
    return;
  }
  
  next();
};

/**
 * Authorization middleware for own resources (user can only access their own resources)
 */
export const authorizeOwn = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
    return;
  }
  
  // Allow admin to access any resource
  if (req.user.role === 'admin') {
    next();
    return;
  }
  
  // Check if user is accessing their own resource
  const resourceId = req.params.id;
  
  if (resourceId !== req.user.userId) {
    res.status(403).json({
      success: false,
      error: 'Not authorized to access this resource',
    });
    return;
  }
  
  next();
}; 