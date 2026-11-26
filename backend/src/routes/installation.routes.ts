import { Router } from "express";

import {
  createInstallationController,
  assignInstallationItemsController,
  updateInstallationScheduleController,
  startInstallationController,
  completeInstallationController,
  getInstallationsController,
  getInstallationByIdController,
} from "../controllers/installation.controller.js";


import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All installation endpoints require an authenticated Admin.
router.use(requireAuth, requireRole("Admin"));

// List installations.
router.get("/", getInstallationsController);

// View one installation.
router.get("/:id", getInstallationByIdController);

// Create an installation.
router.post("/", createInstallationController);

// Assign delivered machines.
router.post("/:id/items", assignInstallationItemsController);

// Schedule an installation.
router.patch("/:id/schedule", updateInstallationScheduleController);

// Start an installation.
router.patch("/:id/start", startInstallationController);

// Complete an installation.
router.patch("/:id/complete", completeInstallationController);

export default router;