// Extend Express Request interface for tests
declare namespace Express {
  interface Request {
    user?: {
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
    };
  }
}
