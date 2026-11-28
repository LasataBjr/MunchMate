export interface CustomerProfile {
  id: number;
  customer_type: "individual" | "company";
  name: string;
  company_name: string | null;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfileResponse {
  success: boolean;
  customer: CustomerProfile;
}