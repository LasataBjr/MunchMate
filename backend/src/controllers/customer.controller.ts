import type { Request, Response } from "express";
import { getCustomerProfile } from "../services/customer.service.js";

export function getMyProfileController(req: Request, res: Response) {
  const customerId = res.locals.authUser.customer_id as number | null;

  if (!customerId) {
    return res.status(403).json({
      success: false,
      message: "Customer account is not linked to a customer profile",
    });
  }

  const customer = getCustomerProfile(customerId);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: "Customer profile not found",
    });
  }

  return res.json({
    success: true,
    customer,
  });
}