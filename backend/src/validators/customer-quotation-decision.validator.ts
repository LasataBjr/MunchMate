import { z } from "zod";

export const customerQuotationDecisionSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export type CustomerQuotationDecisionInput = z.infer< typeof customerQuotationDecisionSchema >;