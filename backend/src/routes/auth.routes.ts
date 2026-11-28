
import { Router } from "express"; // Import the Router class from the Express library
import { env } from "../config/env.js";
import { login } from "../controllers/auth.controller.js";
import { changePasswordController } from "../controllers/auth-password.controller.js";
import { registerCustomer } from "../controllers/customer-auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Public route POST /api/auth/login
router.post("/login", login);
// for customer registration
router.post("/register", registerCustomer);

// Protected route
router.get("/me", requireAuth, (req, res) => {
    return res.json({
        success: true,
        user: res.locals.authUser,
    });
});

router.patch("/change-password", requireAuth, changePasswordController);

// Protected logout route
router.post("/logout", requireAuth, (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Admin-only test endpoint: First, we verify the user's identity. Then we check their permissions
router.get("/admin-test", requireAuth, requireRole("Admin"), (req, res) => {
    return res.json({
      success: true,
      message: "Welcome! You have administrator access.",
    });
  }
);

export default router;
