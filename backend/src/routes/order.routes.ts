import { Router } from "express";
import {
  getOrdersController,
  getOrderByIdController,
  getMyOrdersController,
  getMyOrderByIdController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Customer-only routes
// Defining /my first avoids it being interpreted as an order ID.
router.get("/my", requireAuth, requireRole("Customer"), getMyOrdersController);
router.get("/my/:id", requireAuth, requireRole("Customer"), getMyOrderByIdController);

// Admin-only routes
router.get("/", requireAuth, requireRole("Admin"), getOrdersController);
router.patch("/:id/status", requireAuth, requireRole("Admin"), updateOrderStatusController);
router.get("/:id", requireAuth, requireRole("Admin"), getOrderByIdController);

export default router;