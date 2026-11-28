import { api } from "../../lib/api";
import type {
  CustomerProfileResponse,
  CustomerProfile,
} from "../../features/customer/profile/types/profile.types";

export async function getMyProfile() {
  const response = await api.get<CustomerProfileResponse>("/customers/me");

  return response.data;
}

export async function updateMyProfile(data: {
  name: string;
  email: string;
  phone: string;
  company_name: string | null;
}) {
  const response = await api.patch<{
    success: boolean;
    message: string;
    customer: CustomerProfile;
  }>("/customers/me", data);

  return response.data;
}