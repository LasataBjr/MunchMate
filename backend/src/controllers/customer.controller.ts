import type { Request, Response } from "express";
import { getCustomerProfile, updateCustomerProfile } from "../services/customer.service.js";
import { updateCustomerProfileSchema } from "../validators/customer.validator.js";


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


export function updateMyProfileController(req: Request, res: Response) {
  const customerId = res.locals.authUser.customer_id as number | null;
  const userId = res.locals.authUser.id as number;

  if (!customerId) {
    return res.status(403).json({
      success: false,
      message: "Customer account is not linked to a customer profile",
    });
  }

  const validation = updateCustomerProfileSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid profile details",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const data = validation.data;

  // Check the existing customer type before accepting company details.
  const currentCustomer = getCustomerProfile(customerId) as
    | {
        customer_type: "individual" | "company";
      }
    | undefined;

  if (!currentCustomer) {
    return res.status(404).json({
      success: false,
      message: "Customer profile not found",
    });
  }

  if (
    currentCustomer.customer_type === "company" &&
    !data.company_name
  ) {
    return res.status(400).json({
      success: false,
      message: "Company name is required",
    });
  }

  // Individual customers should not have a company name.
  if (currentCustomer.customer_type === "individual") {
    data.company_name = null;
  }

  // Normalize email before saving.
  data.email = data.email.toLowerCase();

  try {
    updateCustomerProfile(customerId, userId, data);

    const updatedCustomer = getCustomerProfile(customerId);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return res.status(409).json({
        success: false,
        message: "This email address is already being used by another account",
      });
    }

    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }

    if (error instanceof Error && error.message === "USER_NOT_LINKED") {
      return res.status(403).json({
        success: false,
        message: "Customer login account is not properly linked",
      });
    }

    console.error("Customer profile update failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update customer profile",
    });
  }
}