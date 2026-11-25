import type { Request, Response } from "express";

import {
  getWarehouse,
  createWarehouse,
  addMachineToInventory,
  getInventory,
  getInventorySummary,
  reserveOrderInventory,
} from "../services/inventory.service.js";

import {
  createWarehouseSchema,
  addInventoryMachineSchema,
} from "../validators/inventory.validator.js";

// GET /api/inventory/warehouse
export function getWarehouseController(req: Request, res: Response) {
  try {
    const warehouse = getWarehouse();

    return res.status(200).json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error("Get warehouse error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve warehouse",
    });
  }
}

// POST /api/inventory/warehouse
export function createWarehouseController(req: Request, res: Response) {
  try {
    const validation = createWarehouseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid warehouse data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = createWarehouse(
      validation.data.name,
      validation.data.address
    );

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: "A warehouse already exists",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      warehouse: result.warehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create warehouse",
    });
  }
}

// GET /api/inventory
export function getInventoryController(req: Request, res: Response) {
  try {
    const inventory = getInventory();

    return res.status(200).json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory",
    });
  }
}

// GET /api/inventory/summary
export function getInventorySummaryController(req: Request, res: Response) {
  try {
    const summary = getInventorySummary();

    return res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Get inventory summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory summary",
    });
  }
}

// POST /api/inventory/machines
export function addInventoryMachineController(req: Request, res: Response) {
  try {
    const validation = addInventoryMachineSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory machine data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const result = addMachineToInventory(
      validation.data.machine_model_id,
      validation.data.serial_number,
      validation.data.purchase_date,
      res.locals.authUser.id
    );

    if (!result.success) {
      if (result.code === "WAREHOUSE_NOT_FOUND") {
        return res.status(400).json({
          success: false,
          message: "Create an active warehouse before adding machines",
        });
      }

      if (result.code === "MACHINE_MODEL_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Machine model not found",
        });
      }
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Could not add machine to inventory",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Machine added to inventory successfully",
      machine: result.machine,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return res.status(409).json({
        success: false,
        message: "This serial number is already registered",
      });
    }

    console.error("Add inventory machine error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add machine to inventory",
    });
  }
}

// POST /api/inventory/orders/:orderId/reserve
export function reserveOrderInventoryController(req: Request, res: Response) {
  try {
    const orderId = Number(req.params.orderId);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const result = reserveOrderInventory(orderId, res.locals.authUser.id);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message:
          result.code === "ALREADY_RESERVED"
            ? "Inventory is already reserved for this order"
            : "Inventory reserved successfully",
        code: result.code,
      });
    }

    switch (result.code) {
      case "ORDER_NOT_FOUND":
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });

      case "ORDER_NOT_PAID":
        return res.status(409).json({
          success: false,
          message: "Only fully paid orders can reserve inventory",
        });

      case "ORDER_CANCELLED":
        return res.status(409).json({
          success: false,
          message: "Cancelled orders cannot reserve inventory",
        });

      case "ORDER_ITEMS_NOT_FOUND":
        return res.status(409).json({
          success: false,
          message: "This order has no items",
        });

      case "INSUFFICIENT_STOCK":
        return res.status(409).json({
          success: false,
          message: "Insufficient stock to reserve this order",
          shortages: result.shortages,
        });

      case "RESERVATION_CONFLICT":
        return res.status(409).json({
          success: false,
          message:
            "Existing reservations do not match this order. Manual review is required.",
        });
    }
  } catch (error) {
    console.error("Reserve inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reserve inventory",
    });
  }
}