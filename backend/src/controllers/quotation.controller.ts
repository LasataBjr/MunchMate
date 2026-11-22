
import type { Request, Response } from "express";
import {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    updateQuotationStatus,
    QuotationServiceError, 
    getMyQuotations,
    getMyQuotationById,
    decideQuotation,
} from "../services/quotation.service.js";
import { createQuotationSchema, updateQuotationSchema } from "../validators/quotation.validator.js";
import { updateQuotationStatusSchema } from "../validators/quotation-status.validator.js";
import { customerQuotationDecisionSchema } from "../validators/customer-quotation-decision.validator.js";

export function createQuotationController(req: Request, res: Response) {
  try {
    // Validate the incoming request body.
    const validation = createQuotationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation data",
        errors: validation.error.flatten(),
      });
    }

    // Get the authenticated Admin ID from the auth middleware
    const authUser = res.locals.authUser as | { id: number; role: string } | undefined;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Create the quotation.
    const quotation = createQuotation(validation.data, authUser.id);

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation,
    });
  } catch (error) {
    if (error instanceof QuotationServiceError) {
      const statusCode =
        error.code === "ENQUIRY_NOT_FOUND" ? 404 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create quotation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create quotation",
    });
  }
}

// Admin quotation listing
export function getQuotationsController(_req: Request, res: Response) {
  try {
    const result = getQuotations();

    return res.status(200).json({
      success: true,
      total: result.total,
      quotations: result.quotations,
    });
  } catch (error) {
    console.error("Get quotations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve quotations",
    });
  }
}

// Admin quotation detail
export function getQuotationByIdController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const quotation = getQuotationById(id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      quotation,
    });
  } catch (error) {
    console.error("Get quotation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve quotation",
    });
  }
}

export function updateQuotationController(
  req: Request,
  res: Response
) {
  try {
    // Validate quotation ID.
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    // Validate request body.
    const validation = updateQuotationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation data",
        errors: validation.error.flatten(),
      });
    }

    // Update the quotation.
    const quotation = updateQuotation(id, validation.data);

    return res.status(200).json({
      success: true,
      message: "Quotation updated successfully",
      quotation,
    });
  } catch (error) {
    if (error instanceof QuotationServiceError) {
      if (error.code === "QUOTATION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === "QUOTATION_NOT_EDITABLE") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update quotation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update quotation",
    });
  }
}

// Admin: update quotation status
export function updateQuotationStatusController(req: Request, res: Response) {
  try {
    // Validate quotation ID.
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    // Validate request body.
    const validation = updateQuotationStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation status",
        errors: validation.error.flatten(),
      });
    }

    // Update quotation status.
    const quotation = updateQuotationStatus(id, validation.data);

    return res.status(200).json({
      success: true,
      message: "Quotation status updated successfully",
      quotation,
    });
  } catch (error) {
    if (error instanceof QuotationServiceError) {
      if (error.code === "QUOTATION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === "INVALID_STATUS_TRANSITION") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update quotation status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update quotation status",
    });
  }
}

// Customer: list only their own quotations
export function getMyQuotationsController(_req: Request, res: Response) {
  try {
    const customerId = res.locals.authUser.customer_id;

    if (!customerId) {
      return res.status(403).json({
        success: false,
        message: "Customer account required",
      });
    }

    const result = getMyQuotations(customerId);

    return res.status(200).json({
      success: true,
      total: result.total,
      quotations: result.quotations,
    });
  } catch (error) {
    console.error("Get customer quotations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve quotations",
    });
  }
}

// Customer: view one of their own quotations
export function getMyQuotationByIdController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const customerId = res.locals.authUser.customer_id;

    if (!customerId) {
      return res.status(403).json({
        success: false,
        message: "Customer account required",
      });
    }

    const quotation = getMyQuotationById(id, customerId);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      quotation,
    });
  } catch (error) {
    console.error("Get customer quotation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve quotation",
    });
  }
}

// Customer: accept or reject the entire quotation.
export function decideQuotationController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const validation = customerQuotationDecisionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation decision",
        errors: validation.error.flatten(),
      });
    }

    const customerId = res.locals.authUser.customer_id;

    if (!customerId) {
      return res.status(403).json({
        success: false,
        message: "Customer account required",
      });
    }

    const quotation = decideQuotation(
      id,
      customerId,
      validation.data.status
    );

    return res.status(200).json({
      success: true,
      message: `Quotation ${validation.data.status} successfully`,
      quotation,
    });
  } catch (error) {
    if (error instanceof QuotationServiceError) {
      if (error.code === "QUOTATION_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === "INVALID_STATUS_TRANSITION") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }
    }

    console.error("Customer quotation decision error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process quotation decision",
    });
  }
}