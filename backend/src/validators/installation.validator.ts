import { z } from "zod";

export const createInstallationSchema = z.object({
  order_id: z.number().int().positive(),
  delivery_id: z.number().int().positive().optional(),

  address_line: z.string().trim().min(5).max(500).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  district: z.string().trim().max(100).optional(),
  province: z.string().trim().max(100).optional(),
  country: z.string().trim().min(2).max(100).optional(),

  assigned_to: z.number().int().positive().optional(),

  notes: z.string().trim().max(1000).optional(),
});

export const assignInstallationItemsSchema = z.object({
  reservation_ids: z
    .array(z.number().int().positive())
    .min(1)
    .max(100)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Duplicate reservation IDs are not allowed"
    ),
});

export const updateInstallationScheduleSchema = z.object({
  scheduled_at: z.string().datetime(),

  assigned_to: z.number().int().positive().nullable().optional(),
});

export type CreateInstallationInput =
  z.infer<typeof createInstallationSchema>;

export type AssignInstallationItemsInput =
  z.infer<typeof assignInstallationItemsSchema>;

export type UpdateInstallationScheduleInput =
  z.infer<typeof updateInstallationScheduleSchema>;