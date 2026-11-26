import { Router } from "express";

import {
  createDeliveryController,
  assignDeliveryItemsController,
  dispatchDeliveryController,
  markDeliveryItemDeliveredController,
  getDeliveriesController,
  getDeliveryByIdController,
  updateDeliveryScheduleController,
} from "../controllers/delivery.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

// Use the same requireAuth and requireRole imports
// as src/routes/inventory.routes.ts.

const router = Router();

// All delivery endpoints require an authenticated Admin.
router.use(requireAuth, requireRole("Admin"));

// Create a delivery.
router.post("/", createDeliveryController);

// Assign reserved machines to a delivery.
router.post("/:id/items", assignDeliveryItemsController);

// Dispatch a delivery.
router.patch("/:id/dispatch", dispatchDeliveryController);

// Confirm an individual machine has been delivered.
router.patch(
  "/items/:itemId/delivered",
  markDeliveryItemDeliveredController
);

// List all deliveries.
router.get("/", getDeliveriesController);

// Get one delivery and its assigned machines.
router.get("/:id", getDeliveryByIdController);

// Update a delivery schedule.
router.patch("/:id/schedule", updateDeliveryScheduleController);

export default router;