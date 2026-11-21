
import { z } from "zod";

// Validation schema for creating a new machine. Ensures that the input data adheres to the expected structure and constraints.
export const createMachineSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().trim().min(2).max(150),
  model_number: z.string().trim().min(2).max(50),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only"
    ),
  description: z.string().trim().max(5000).nullable().optional(),
  specifications: z.string().max(10000).nullable().optional(),
  base_price_paisa: z.number().int().min(0),
});

// TypeScript type inferred from the createMachineSchema. 
// This type can be used throughout the application to ensure that any data related to creating a machine adheres to the defined structure and constraints.
export type CreateMachineInput = z.infer<typeof createMachineSchema>;

// For updating, we can reuse the same schema as the structure and constraints for creating and updating a machine are identical.
export const updateMachineSchema = createMachineSchema;
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>;

// Validation schema for updating the status of a machine (active/inactive).
export const updateMachineStatusSchema = z.object({
  is_active: z.boolean(),
});
export type UpdateMachineStatusInput = z.infer<typeof updateMachineStatusSchema>;