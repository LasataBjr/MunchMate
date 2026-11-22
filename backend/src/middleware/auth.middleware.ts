//middleware that checks the token before allowing access to protected routes
import type { RequestHandler } from "express"; //
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../database/connection.js";

export const requireAuth: RequestHandler = (req, res, next) => {
  // Read JWT from the cookie
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    // Verify the JWT signature and expiration
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if ( typeof decoded === "string" || typeof decoded.userId !== "number" ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // Check that the user still exists and is active
    const user = db.prepare(`
      SELECT
        users.id,
        users.name,
        users.email,
        users.customer_id,
        users.is_active,
        roles.name AS role
      FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.id = ?
    `).get(decoded.userId) as
      | {
          id: number;
          name: string;
          email: string;
          customer_id: number | null;
          is_active: number;
          role: string;
        }
      | undefined;

    if (!user || user.is_active !== 1) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable",
      });
    }

    // Make authenticated user available to the route
    res.locals.authUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      customer_id: user.customer_id,
      role: user.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};
