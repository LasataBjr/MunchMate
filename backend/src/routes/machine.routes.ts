
import { Router } from "express";
import { getCategories, getMachines, getMachineDetails, createMachineController, updateMachineController, updateMachineStatusController} from "../controllers/machine.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Public Routes
router.get("/categories", getCategories);
router.get("/", getMachines);
router.get("/:id", getMachineDetails);

// Protected Routes (Admin Only)
router.post( "/", requireAuth, requireRole("Admin"), createMachineController);
router.put("/:id", requireAuth, requireRole("Admin"), updateMachineController);
router.patch("/:id/status", requireAuth, requireRole("Admin"), updateMachineStatusController);

export default router;
