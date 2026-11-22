
import { z } from "zod";

export const customerRegistrationSchema = z
  .object({
    customer_type: z.enum(["individual", "company"]),
    name: z.string().trim().min(2).max(150),
    company_name: z.string().trim().max(150).nullable().optional(),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(7).max(20),
    password: z.string().min(8).max(128),
  })
  .superRefine((data, ctx) => {
    if ( data.customer_type === "company" &&
      (!data.company_name || data.company_name.length < 2)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["company_name"],
        message: "Company name is required for company accounts",
      });
    }
  });

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>;
