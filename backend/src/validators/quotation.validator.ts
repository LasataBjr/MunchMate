//backend will calculate line totals, subtotal and final total. We won't trust totals sent by the frontend

import { z } from "zod";

// Validate an individual machine included in a quotation.
const quotationItemSchema = z.object({
  machine_model_id: z.number().int().positive(),

  quantity: z.number().int().positive(),

  // Optional custom description. If omitted, the service
  // will use the machine's current catalogue name.
  description: z.string().trim().min(1).max(500).optional(),

  // Price is entered in paisa, not rupees.
  unit_price_paisa: z.number().int().nonnegative(),
});

// Validate the complete quotation.
export const createQuotationSchema = z.object({
  enquiry_id: z.number().int().positive(),
  items: z.array(quotationItemSchema).min(1).max(50),
  discount_paisa: z.number().int().nonnegative().default(0),
  tax_amount_paisa: z.number().int().nonnegative().default(0),
  // Expected format: YYYY-MM-DD
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),

  terms: z.string().trim().max(5000).nullable().optional(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;


// Validate an individual machine when updating a quotation.
const updateQuotationItemSchema = z.object({
  machine_model_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  description: z.string().trim().min(1).max(500).optional(),
  unit_price_paisa: z.number().int().nonnegative(),
});

// Validate the editable fields of an existing quotation.
export const updateQuotationSchema = z.object({
  items: z.array(updateQuotationItemSchema).min(1).max(50),
  discount_paisa: z.number().int().nonnegative().default(0),
  tax_amount_paisa: z.number().int().nonnegative().default(0),
  valid_until: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  terms: z.string()
    .trim()
    .max(5000)
    .nullable()
    .optional(),
});

export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
