
import { z } from "zod";

// Validate one machine requested in the enquiry.
const enquiryItemSchema = z.object({
  machine_model_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

// Validate the complete customer enquiry.
export const createEnquirySchema = z.object({
  customer: z.object({
    customer_type: z.enum(["individual", "company"]),
    name: z.string().trim().min(2).max(150),
    company_name: z.string().trim().max(150).nullable().optional(),
    email: z.string().trim().email().max(254).nullable().optional(),
    phone: z.string().trim().min(7).max(20),
  }),

  message: z.string().trim().max(5000).nullable().optional(),
  items: z.array(enquiryItemSchema).min(1).max(50),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
