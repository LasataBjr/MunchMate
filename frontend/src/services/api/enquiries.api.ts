
import { api } from "../../lib/api";

import type {
  CreateEnquiryInput,
  CreateEnquiryResponse,
  MyEnquiriesResponse,
  MyEnquiryDetailsResponse,
} from "../../features/public/enquiries/types/enquiry.types";

// Submit a new customer enquiry
export async function createEnquiry(input: CreateEnquiryInput) {
  const response = await api.post<CreateEnquiryResponse>(
    "/enquiries",
    input
  );

  return response.data;
}

// Get enquiries belonging to the logged-in customer
export async function getMyEnquiries() {
  const response = await api.get<MyEnquiriesResponse>(
    "/enquiries/my"
  );

  return response.data;
}

 // Get one enquiry belonging to the logged-in customer
export async function getMyEnquiryById(id: number) {
  const response = await api.get<MyEnquiryDetailsResponse>(
    `/enquiries/my/${id}`
  );

  return response.data;
}

