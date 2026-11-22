import { Router } from "express";
import {
  createEnquiryController,
  getEnquiriesController,
  getEnquiryByIdController,
  updateEnquiryStatusController,
  getMyEnquiriesController,
  getMyEnquiryByIdController,
} from "../controllers/enquiry.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Customer-only routes
router.post("/", requireAuth, requireRole("Customer"), createEnquiryController);
router.get("/my", requireAuth, requireRole("Customer"), getMyEnquiriesController);
router.get("/my/:id", requireAuth, requireRole("Customer"), getMyEnquiryByIdController);

// Admin-only routes
router.get("/", requireAuth, requireRole("Admin"), getEnquiriesController);
router.get("/:id", requireAuth, requireRole("Admin"), getEnquiryByIdController);
router.patch("/:id/status", requireAuth, requireRole("Admin"), updateEnquiryStatusController);

export default router;