
import { Router } from "express";
import { createEnquiryController, getEnquiriesController, getEnquiryByIdController, updateEnquiryStatusController } from "../controllers/enquiry.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Public endpoint: customers can submit enquiries without logging in.
router.post("/", createEnquiryController);

// Admin-only endpoint: view all enquiries.
router.get("/", requireAuth, requireRole("Admin"), getEnquiriesController);
router.get("/:id", requireAuth, requireRole("Admin"), getEnquiryByIdController);
router.patch("/:id/status", requireAuth, requireRole("Admin"), updateEnquiryStatusController);

export default router;
