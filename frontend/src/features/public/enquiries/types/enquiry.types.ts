import type { Machine } from "../../machine-catalog/types/machine.types";

export interface SelectedEnquiryItem {
  machine: Machine
  item: EnquiryItemInput
}

// One machine selected in the enquiry form
export interface EnquiryItemInput {
  machine_model_id: number;
  quantity: number;
  notes?: string | null;
}

// Data sent to the backend
export interface CreateEnquiryInput {
  message?: string | null;
  items: EnquiryItemInput[];
}

// Machine information returned with an enquiry
export interface EnquiryMachineItem {
  id: number;
  machine_model_id: number;
  machine_name: string;
  model_number: string;
  quantity: number;
  notes: string | null;
}

// Enquiry returned after successful submission
export interface Enquiry {
  id: number;
  enquiry_number: string;
  status: string;
  message: string | null;
  created_at: string;
  customer_id: number;
  customer_type: string;
  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  items: EnquiryMachineItem[];
}

// API response when creating an enquiry
export interface CreateEnquiryResponse {
  success: boolean;
  message: string;
  enquiry: Enquiry;
}

// Useful for the frontend machine selector
export type EnquiryMachine = Machine;

// One enquiry in the customer's enquiry list
export interface MyEnquiryListItem {
  id: number;
  enquiry_number: string;
  status: string;
  message: string | null;
  created_at: string;
  total_items: number;
}

// Response from GET /enquiries/my
export interface MyEnquiriesResponse {
  success: boolean;
  total: number;
  enquiries: MyEnquiryListItem[];
}

// GET /enquiries/my/:id
export interface MyEnquiryDetailsResponse {
  success: boolean;
  enquiry: {
    id: number;
    enquiry_number: string;
    status: string;
    message: string | null;
    created_at: string;
    updated_at: string;
    items: EnquiryMachineItem[];
  };
}
