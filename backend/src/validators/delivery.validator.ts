
import { z } from "zod";

// Create a delivery for an order
export const createDeliverySchema = z.object({
  order_id: z.number().int().positive(),

  address_line: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  country: z.string().trim().min(2).max(100),

  tracking_reference: z.string().trim().max(150).optional(),
  scheduled_at: z.string().datetime().optional(),
  notes: z.string().trim().max(1000).optional(),
});

// Assign reserved machines to a delivery
export const assignDeliveryItemsSchema = z.object({
  reservation_ids: z
    .array(z.number().int().positive())
    .min(1)
    .max(100)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Duplicate reservation IDs are not allowed"
    ),
});

// Update delivery scheduling details
export const updateDeliveryScheduleSchema = z.object({
  scheduled_at: z.string().datetime(),
  tracking_reference: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type AssignDeliveryItemsInput = z.infer<typeof assignDeliveryItemsSchema>;
export type UpdateDeliveryScheduleInput = z.infer<
  typeof updateDeliveryScheduleSchema
>;
