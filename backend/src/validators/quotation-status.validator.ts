//non-draft quotations cannot be edited

import { z } from "zod";

// Admin can mark a draft quotation as sent.
export const updateQuotationStatusSchema = z.object({
  status: z.literal("sent"),
});

export type UpdateQuotationStatusInput = z.infer<typeof updateQuotationStatusSchema>;
