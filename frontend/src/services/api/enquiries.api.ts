import { api } from "../../lib/api";

import type {
  CreateEnquiryInput,
  CreateEnquiryResponse,
} from "../../features/public/enquiries/types/enquiry.types";

// Submit a new customer enquiry
export async function createEnquiry(input: CreateEnquiryInput) {
  const response = await api.post<CreateEnquiryResponse>(
    "/enquiries",
    input
  );

  return response.data;
}