
import type { Request, Response } from "express";
import { getMachineCategories, getActiveMachines, getMachineById, createMachine, updateMachine, updateMachineStatus, } from "../services/machine.service.js";
import { createMachineSchema, updateMachineSchema, updateMachineStatusSchema, } from "../validators/machine.validator.js";

// Provides a list of all machine categories, including their details.
export function getCategories(req: Request, res: Response) {
  try {
    const categories = getMachineCategories();

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get machine categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve machine categories",
    });
  }
}

// Provides a list of all active machines, including their details and associated category information.
export function getMachines(req: Request, res: Response) {
  try {
    const machines = getActiveMachines();

    return res.status(200).json({
      success: true,
      count: machines.length,
      machines,
    });
  } catch (error) {
    console.error("Get machines error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve machines",
    });
  }
}

// Provides details of a specific machine by its ID, including its associated category information.
export function getMachineDetails(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid machine ID",
      });
    }

    const machine = getMachineById(id);

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: "Machine not found",
      });
    }

    return res.status(200).json({
      success: true,
      machine,
    });
  } catch (error) {
    console.error("Get machine details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve machine details",
    });
  }
}


export function createMachineController(req: Request, res: Response) {
  try {
    // Validate incoming request data
    const validation = createMachineSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid machine data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Create machine in the database
    const machine = createMachine(validation.data);

    return res.status(201).json({
      success: true,
      message: "Machine created successfully",
      machine,
    });
  } catch (error) {
    // Category does not exist
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
      return res.status(400).json({
        success: false,
        message: "Selected machine category does not exist",
      });
    }

    // Duplicate model number or slug
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return res.status(409).json({
        success: false,
        message: "Machine model number or slug already exists",
      });
    }

    console.error("Create machine error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create machine",
    });
  }
}

// Updates an existing machine
export function updateMachineController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    // Validate machine ID.
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid machine ID",
      });
    }

    // Validate request body.
    const validation = updateMachineSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid machine data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Update machine.
    const machine = updateMachine(id, validation.data);

    return res.status(200).json({
      success: true,
      message: "Machine updated successfully",
      machine,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MACHINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Machine not found",
      });
    }

    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
      return res.status(400).json({
        success: false,
        message: "Selected machine category does not exist",
      });
    }

    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return res.status(409).json({
        success: false,
        message: "Machine model number or slug already exists",
      });
    }

    console.error("Update machine error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update machine",
    });
  }
}

// Activates or deactivates an existing machine
export function updateMachineStatusController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    // Validate machine ID.
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid machine ID",
      });
    }

    // Validate status data.
    const validation = updateMachineStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid machine status",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Update machine status.
    const machine = updateMachineStatus(id, validation.data.is_active);

    return res.status(200).json({
      success: true,
      message: validation.data.is_active
        ? "Machine activated successfully"
        : "Machine deactivated successfully",
      machine,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MACHINE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Machine not found",
      });
    }

    console.error("Update machine status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update machine status",
    });
  }
}