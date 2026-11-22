
import type { Request, Response, RequestHandler } from "express";
import { createEnquiry, getEnquiries, getEnquiryById, updateEnquiryStatus, getMyEnquiries, getMyEnquiryById,} from "../services/enquiry.service.js";
import { createEnquirySchema } from "../validators/enquiry.validator.js";
import { updateEnquiryStatusSchema } from "../validators/enquiry-status.validator.js";

// Handles customer enquiry submissions.
export function createEnquiryController(req: Request, res: Response) {
  try {
    // Validate the incoming request
    const validation = createEnquirySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Get the authenticated customer's ID from the request context
    const customerId = res.locals.authUser.customer_id;

    if (!customerId) {
      return res.status(403).json({
        success: false,
        message: "Customer account is not properly linked",
      });
    }

    const enquiry = createEnquiry(validation.data, customerId);

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      enquiry,
    });
  } catch (error) {
    // Handle inactive or nonexistent machine models.
    if (error instanceof Error && error.message === "MACHINE_NOT_AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: "One or more selected machines are unavailable",
      });
    }

    console.error("Create enquiry error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit enquiry",
    });
  }
}


// Returns the enquiry list for Admin users.
export function getEnquiriesController(req: Request, res: Response) {
  try {
    const enquiries = getEnquiries();

    return res.status(200).json({
      success: true,
      total: enquiries.length,
      enquiries,
    });
  } catch (error) {
    console.error("Get enquiries error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve enquiries",
    });
  }
}

// Returns one enquiry with its complete details.
export function getEnquiryByIdController(req: Request, res: Response) {
  try {
    // Validate the enquiry ID from the URL.
    const enquiryId = Number(req.params.id);

    if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID",
      });
    }

    // Retrieve the enquiry.
    const enquiry = getEnquiryById(enquiryId);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      enquiry,
    });
  } catch (error) {
    console.error("Get enquiry details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve enquiry details",
    });
  }
}

// Updates the status of an enquiry.
export function updateEnquiryStatusController(req: Request, res: Response) {
  try {
    // Validate the enquiry ID.
    const enquiryId = Number(req.params.id);

    if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry ID",
      });
    }

    // Validate the requested status.
    const validation = updateEnquiryStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid enquiry status",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Update the enquiry.
    const enquiry = updateEnquiryStatus(enquiryId, validation.data);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Update enquiry status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update enquiry status",
    });
  }
}

// Get enquiries belonging to the logged-in customer.
export const getMyEnquiriesController: RequestHandler = (req, res) => {
  const customerId = res.locals.authUser.customer_id;

  if (!customerId) {
    return res.status(403).json({
      success: false,
      message: "Customer account required",
    });
  }

  const enquiries = getMyEnquiries(customerId);

  return res.json({
    success: true,
    total: enquiries.length,
    enquiries,
  });
};

// Get one enquiry belonging to the logged-in customer.
export const getMyEnquiryByIdController: RequestHandler = (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid enquiry ID",
    });
  }

  const customerId = res.locals.authUser.customer_id;

  if (!customerId) {
    return res.status(403).json({
      success: false,
      message: "Customer account required",
    });
  }

  const enquiry = getMyEnquiryById(id, customerId);

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Enquiry not found",
    });
  }

  return res.json({
    success: true,
    enquiry,
  });
};