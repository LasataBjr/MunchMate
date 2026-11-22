
import { Router } from "express";
import { createQuotationController, getQuotationsController, getQuotationByIdController, updateQuotationController, updateQuotationStatusController } from "../controllers/quotation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All quotation routes require Admin authentication
router.use(requireAuth, requireRole("Admin"));

// List all quotations
router.get("/", getQuotationsController);
// Get one quotation
router.get("/:id", getQuotationByIdController);
// Create a quotation
router.post("/", createQuotationController);
//Update a quotation
router.put("/:id", updateQuotationController);
//Update a quotation status
router.patch("/:id/status", updateQuotationStatusController);

export default router;
