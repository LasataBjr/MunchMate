import { Router } from "express";

import {
  createQuotationController,
  getQuotationsController,
  getQuotationByIdController,
  updateQuotationController,
  updateQuotationStatusController,
  getMyQuotationsController,
  getMyQuotationByIdController,
  decideQuotationController,
} from "../controllers/quotation.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Customer-only routes
// Customer-only route to view all their quotations
router.get("/my", requireAuth, requireRole("Customer"), getMyQuotationsController);
// Customer-only route to view a specific quotation by ID
router.get("/my/:id", requireAuth, requireRole("Customer"), getMyQuotationByIdController);
// Customer-only route to accept or reject a quotation
router.patch("/:id/decision", requireAuth, requireRole("Customer"), decideQuotationController);

// Admin-only routes
router.get("/", requireAuth, requireRole("Admin"), getQuotationsController);

router.get(
  "/:id",
  requireAuth,
  requireRole("Admin"),
  getQuotationByIdController
);

router.post(
  "/",
  requireAuth,
  requireRole("Admin"),
  createQuotationController
);

router.put(
  "/:id",
  requireAuth,
  requireRole("Admin"),
  updateQuotationController
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRole("Admin"),
  updateQuotationStatusController
);

export default router;