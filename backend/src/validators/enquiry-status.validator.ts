import { z } from "zod";

// Validate enquiry status updates.
export const updateEnquiryStatusSchema = z.object({
  status: z.enum([
    "new",
    "reviewing",
    "quoted",
    "converted",
    "cancelled",
  ]),
});

export type UpdateEnquiryStatusInput = z.infer<typeof updateEnquiryStatusSchema>;