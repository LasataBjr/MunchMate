import { Router } from "express";
import {
  getMyProfileController,
  updateMyProfileController,
} from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/me", requireAuth, requireRole("Customer"), getMyProfileController);

router.patch("/me", requireAuth, requireRole("Customer"), updateMyProfileController);

export default router;