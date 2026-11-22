import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["confirmed", "processing", "completed", "cancelled"]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;