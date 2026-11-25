import { Router } from "express";

import {
  getWarehouseController,
  createWarehouseController,
  getInventoryController,
  getInventorySummaryController,
  addInventoryMachineController,
  reserveOrderInventoryController,
} from "../controllers/inventory.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Every inventory endpoint is Admin-only.
router.use(requireAuth, requireRole("Admin"));

router.get("/warehouse", getWarehouseController);
router.post("/warehouse", createWarehouseController);

router.get("/summary", getInventorySummaryController);
router.get("/", getInventoryController);

router.post("/machines", addInventoryMachineController);

router.post(
  "/orders/:orderId/reserve",
  reserveOrderInventoryController
);

export default router;