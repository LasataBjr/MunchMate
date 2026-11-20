// middleware that checks the authenticated user's role before allowing access to a route
import type { RequestHandler } from "express";

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req, res, next) => {
    // Get the authenticated user from requireAuth middleware
    const user = res.locals.authUser as
      | {
          id: number;
          name: string;
          email: string;
          role: string;
        }
      | undefined;

    // Make sure the user is authenticated
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check whether the user's role is allowed
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    return next();
  };
}
