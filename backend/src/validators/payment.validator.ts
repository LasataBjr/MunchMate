import { z } from "zod";

export const initiatePaymentSchema = z.object({
  payment_method: z.enum(["qr", "mobile_banking"]).optional(),
});

export const simulatePaymentSchema = z.object({
  outcome: z.enum(["successful", "failed", "expired"]),
});