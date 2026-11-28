import { Router } from "express";
import { getMyProfileController } from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Customer profile
router.get("/me", requireAuth, requireRole("Customer"), getMyProfileController);

export default router;