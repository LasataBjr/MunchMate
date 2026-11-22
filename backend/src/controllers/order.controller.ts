import type { Request, Response } from "express";
import {
  getOrders,
  getOrderById,
  getMyOrders,
  getMyOrderById,
  updateOrderStatus,
} from "../services/order.service.js";
import { updateOrderStatusSchema } from "../validators/order-status.validator.js";

export function getOrdersController(_req: Request, res: Response) {
  const orders = getOrders();

  return res.status(200).json({
    success: true,
    orders,
  });
}

export function getOrderByIdController(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const order = getOrderById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  return res.status(200).json({
    success: true,
    order,
  });
}

export function getMyOrdersController(_req: Request, res: Response) {
  const customerId = res.locals.authUser.customer_id as number;

  const orders = getMyOrders(customerId);

  return res.status(200).json({
    success: true,
    orders,
  });
}

export function getMyOrderByIdController(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const customerId = res.locals.authUser.customer_id as number;

  const order = getMyOrderById(id, customerId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  return res.status(200).json({
    success: true,
    order,
  });
}

export function updateOrderStatusController(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const validation = updateOrderStatusSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.flatten(),
    });
  }

  const result = updateOrderStatus(id, validation.data.status);

  if (result === "NOT_FOUND") {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (result === "INVALID_TRANSITION") {
    return res.status(409).json({
      success: false,
      message: "Invalid order status transition",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order: result,
  });
}