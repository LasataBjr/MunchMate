
import { z } from "zod";

// Validate one machine requested in the enquiry.
const enquiryItemSchema = z.object({
  machine_model_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

// Validate the complete enquiry.
// Customer identity comes from the authenticated account,
// so it must not be accepted from the request body.
export const createEnquirySchema = z.object({
  message: z.string().trim().max(5000).nullable().optional(),
  items: z.array(enquiryItemSchema).min(1).max(50),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
