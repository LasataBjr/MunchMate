
import { Router } from "express";
import {
  checkFonepayPaymentStatusController,
  getAdminPaymentsController,
  initiatePaymentController,
  initiateFonepayPaymentController,
  simulatePaymentController,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Admin-only payment history
router.get("/admin", requireAuth, requireRole("Admin"), getAdminPaymentsController);

// Customer-only payment initiation
router.post("/orders/:orderId/initiate", requireAuth, requireRole("Customer"), initiatePaymentController);

// Customer-only Fonepay Dynamic QR initiation
router.post("/orders/:orderId/fonepay", requireAuth, requireRole("Customer"), initiateFonepayPaymentController);

// Customer-only Fonepay status verification.
router.post("/:paymentId/check-status", requireAuth, requireRole("Customer"), checkFonepayPaymentStatusController);

// Development-only simulator so it is not applicable to production
router.post("/:paymentId/simulate", (req, res, next) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }
    next();
  },
  requireAuth, requireRole("Customer"), simulatePaymentController
);

export default router;
