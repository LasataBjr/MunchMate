import { z } from "zod";

export const updateCustomerProfileSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(20),
  company_name: z.string().trim().min(2).max(150).nullable(),
});

export type UpdateCustomerProfileInput = z.infer<
  typeof updateCustomerProfileSchema
>;