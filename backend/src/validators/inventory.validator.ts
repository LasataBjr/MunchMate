import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().trim().min(2).max(150),
  address: z.string().trim().min(5).max(500),
});

export const addInventoryMachineSchema = z.object({
  machine_model_id: z.number().int().positive(),
  serial_number: z.string().trim().min(2).max(100),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .optional(),
});


export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;

export type AddInventoryMachineInput = z.infer<typeof addInventoryMachineSchema>;