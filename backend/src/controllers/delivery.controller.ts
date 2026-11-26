import type { Request, Response } from "express";

import {
  createDelivery,
  assignDeliveryItems,
  dispatchDelivery,
  markDeliveryItemDelivered,
  getDeliveries,
  getDeliveryById,
  updateDeliverySchedule,
} from "../services/delivery.service.js";

import {
  createDeliverySchema,
  assignDeliveryItemsSchema,
  updateDeliveryScheduleSchema,
} from "../validators/delivery.validator.js";

// Convert and validate an ID from a URL parameter.
function parseId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// Convert service errors into appropriate HTTP responses.
function sendDeliveryError(res: Response, code: string) {
  const notFoundCodes = [
    "ORDER_NOT_FOUND",
    "DELIVERY_NOT_FOUND",
    "DELIVERY_ITEM_NOT_FOUND",
  ];

  const badRequestCodes = [
    "INVALID_RESERVATIONS",
    "INVALID_DELIVERY_ITEMS",
  ];

  const status = notFoundCodes.includes(code)
    ? 404
    : badRequestCodes.includes(code)
      ? 400
      : 409;

  return res.status(status).json({
    success: false,
    code,
  });
}

// Create a delivery.
export function createDeliveryController(
  req: Request,
  res: Response
) {
  const parsed = createDeliverySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery information",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = createDelivery(parsed.data);

    if (!result.success) {
      return sendDeliveryError(res, result.code);
    }

    return res.status(201).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to create delivery",
    });
  }
}

// Assign reserved machines to a delivery.
export function assignDeliveryItemsController(
  req: Request,
  res: Response
) {
  const deliveryId = parseId(req.params.id);

  if (!deliveryId) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery ID",
    });
  }

  const parsed = assignDeliveryItemsSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery items",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = assignDeliveryItems(deliveryId, parsed.data);

    if (!result.success) {
      return sendDeliveryError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to assign delivery items",
    });
  }
}

// Dispatch a delivery.
export function dispatchDeliveryController(
  req: Request,
  res: Response
) {
  const deliveryId = parseId(req.params.id);

  if (!deliveryId) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery ID",
    });
  }

  try {
    const result = dispatchDelivery(
      deliveryId,
      res.locals.authUser.id
    );

    if (!result.success) {
      return sendDeliveryError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to dispatch delivery",
    });
  }
}

// Confirm that an individual machine has been delivered.
export function markDeliveryItemDeliveredController(
  req: Request,
  res: Response
) {
  const itemId = parseId(req.params.itemId);

  if (!itemId) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery item ID",
    });
  }

  try {
    const result = markDeliveryItemDelivered(itemId);

    if (!result.success) {
      return sendDeliveryError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to confirm delivery",
    });
  }
}

// List all deliveries.
export function getDeliveriesController(
  req: Request,
  res: Response
) {
  try {
    const deliveries = getDeliveries();

    return res.status(200).json({
      success: true,
      data: deliveries,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve deliveries",
    });
  }
}

// Get one delivery with its assigned machines.
export function getDeliveryByIdController(
  req: Request,
  res: Response
) {
  const deliveryId = parseId(req.params.id);

  if (!deliveryId) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery ID",
    });
  }

  try {
    const delivery = getDeliveryById(deliveryId);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        code: "DELIVERY_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve delivery",
    });
  }
}

// Update a delivery schedule.
export function updateDeliveryScheduleController(
  req: Request,
  res: Response
) {
  const deliveryId = parseId(req.params.id);

  if (!deliveryId) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery ID",
    });
  }

  const parsed = updateDeliveryScheduleSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid delivery schedule",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const result = updateDeliverySchedule(deliveryId, parsed.data);

    if (!result.success) {
      return sendDeliveryError(res, result.code);
    }

    return res.status(200).json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to update delivery schedule",
    });
  }
}